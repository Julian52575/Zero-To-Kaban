#!/usr/bin/env bash
# Simulate a few users using the app, to see how much CPU/memory it needs.
#
#   deployment/scripts/simulate-traffic.sh [requests_per_second] [seconds]
#
# Talks to the app through its front door (Traefik), so every request goes
# through the same ForwardAuth check as a real browser. It signs in once
# (login is rate limited to 10 per 15 min per IP, register to 5 per hour, so
# it never signs in per request), creates its own project, sends a mixed
# read-heavy load with some writes, then deletes the project (columns and
# tasks are deleted with it) and prints a summary.
#
# Env:
#   BASE_URL       where Traefik listens       (default http://localhost:18080, `just up-local`;
#                                               the docker-compose stack is http://localhost:$PROXY_PORT)
#   RPS            target requests per second  (default 20, or the 1st argument)
#   DURATION       seconds of load             (default 60, or the 2nd argument)
#   WORKERS        parallel clients            (default 8)
#   LOAD_USER / LOAD_PASSWORD   account to use, created on first run (default loadtest / loadtest-password)
#   ALLOW_REMOTE=1 allow a BASE_URL that isn't localhost / 127.x / ::1 (never use it on prod)
#
# The rate is a target: each worker waits between requests, so slow answers
# lower the real rate. The summary prints what was actually reached.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:18080}"
BASE_URL="${BASE_URL%/}"
RPS="${1:-${RPS:-20}}"
DURATION="${2:-${DURATION:-60}}"
WORKERS="${WORKERS:-8}"
LOAD_USER="${LOAD_USER:-loadtest}"
LOAD_PASSWORD="${LOAD_PASSWORD:-loadtest-password}"

# This registers an account with a well-known password and hammers the target,
# so it refuses anything but a local address unless told otherwise. Never aim
# it at prod.
host="${BASE_URL#*://}"; host="${host%%/*}"
case "$host" in
    \[*) host="${host%%]*}]" ;;
    *) host="${host%%:*}" ;;
esac
case "$host" in
    localhost | *.localhost | 127.* | "[::1]") ;;
    *)
        if [[ "${ALLOW_REMOTE:-}" != "1" ]]; then
            echo "error: $BASE_URL is not a local address. This script creates an account with a public password and generates load; only run it against a dev app you own. Set ALLOW_REMOTE=1 to override." >&2
            exit 1
        fi
        ;;
esac

for tool in curl jq awk; do
    command -v "$tool" >/dev/null || { echo "error: '$tool' is required" >&2; exit 1; }
done
for n in RPS DURATION WORKERS; do
    [[ "${!n}" =~ ^[1-9][0-9]*$ ]] || { echo "error: $n must be a positive integer, got '${!n}'" >&2; exit 1; }
done

tmp="$(mktemp -d)"
jar="$tmp/cookies.txt"
project_id=""
worker_pids=()

# Delete what we created, even when interrupted.
cleanup() {
    trap - EXIT INT TERM
    if ((${#worker_pids[@]})); then kill "${worker_pids[@]}" 2>/dev/null || true; fi
    if [[ -n "$project_id" ]]; then
        code="$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -b "$jar" -X DELETE "$BASE_URL/api/projects/$project_id" || true)"
        if [[ "$code" != 2* ]]; then
            echo "warning: could not delete the simulated project $project_id (answered ${code:-nothing}); delete it by hand" >&2
        fi
    fi
    rm -rf "$tmp"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# api METHOD PATH [JSON] -> prints the body, fails on a non-2xx status
api() {
    local method="$1" path="$2" body="${3:-}" out code
    out="$tmp/response.json"
    if [[ -n "$body" ]]; then
        code="$(curl -s --max-time 10 -o "$out" -w '%{http_code}' -b "$jar" -c "$jar" -X "$method" \
            -H 'Content-Type: application/json' -d "$body" "$BASE_URL$path")"
    else
        code="$(curl -s --max-time 10 -o "$out" -w '%{http_code}' -b "$jar" -c "$jar" -X "$method" "$BASE_URL$path")"
    fi
    if [[ "$code" != 2* ]]; then
        echo "error: $method $path answered $code: $(head -c 300 "$out")" >&2
        return 1
    fi
    cat "$out"
}

credentials="$(jq -n --arg u "$LOAD_USER" --arg p "$LOAD_PASSWORD" '{username:$u,password:$p}')"

echo "target: $BASE_URL  (~$RPS req/s for ${DURATION}s, $WORKERS workers)"

# /login is public and served by the auth service; /healthz isn't routed at the edge.
if ! curl -s --max-time 10 -o /dev/null -f "$BASE_URL/login"; then
    echo "error: $BASE_URL/login is not answering -- is the app up? (just up-local, or docker compose up)" >&2
    exit 1
fi

# Sign in, or create the account on the first run.
login_code="$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -c "$jar" -H 'Content-Type: application/json' \
    -d "$credentials" "$BASE_URL/auth/login")"
case "$login_code" in
    200) ;;
    401) api POST /auth/register "$credentials" >/dev/null ;;
    429) echo "error: login is rate limited (10 per 15 min per IP); wait, or restart the auth service" >&2; exit 1 ;;
    *) echo "error: login answered $login_code" >&2; exit 1 ;;
esac

project_body="$(jq -n --arg n "loadtest-$(date +%s)" '{name:$n}')"
project_id="$(api POST /api/projects "$project_body" | jq -er .id)"

# An older backend image (e.g. a stale hand-built tag) has projects but no
# columns/tasks. A 404 means "not there": fall back to a projects-only mix.
# Any other failure is a real error.
columns_code="$(curl -s --max-time 10 -o "$tmp/columns.json" -w '%{http_code}' -b "$jar" "$BASE_URL/api/projects/$project_id/columns")"
task_body=""
case "$columns_code" in
    2*)
        tasks_supported=1
        column_id="$(jq -er '.[0].id' "$tmp/columns.json")"
        task_body="$(jq -n --arg c "$column_id" '{title:"simulated task",description:"created by simulate-traffic.sh",columnId:$c}')"
        api POST "/api/projects/$project_id/tasks" "$task_body" >/dev/null
        ;;
    404)
        tasks_supported=0
        echo "note: this backend has no tasks/columns endpoints (older image?), so tasks are left out of the mix; writes are project create+delete instead"
        ;;
    *)
        echo "error: GET /api/projects/$project_id/columns answered $columns_code" >&2
        exit 1
        ;;
esac

# Write for the projects-only mix: create a project, then delete it again.
write_project() {
    local log="$1" out code seconds id
    out="$(curl -s --max-time 10 -w '\n%{http_code} %{time_total}' -b "$jar" -H 'Content-Type: application/json' \
        -d "$project_body" "$BASE_URL/api/projects" || true)"
    read -r code seconds <<<"${out##*$'\n'}"
    echo "POST /api/projects ${code:-000} ${seconds:-0}" >>"$log"
    id="$(jq -r '.id // empty' <<<"${out%$'\n'*}" 2>/dev/null || true)"
    if [[ -n "$id" ]]; then
        curl -s --max-time 10 -o /dev/null -w "DELETE /api/projects/:id %{http_code} %{time_total}\n" \
            -b "$jar" -X DELETE "$BASE_URL/api/projects/$id" >>"$log" || true
    fi
}

# One client: a random action every $delay seconds until the deadline.
# Each request appends "METHOD PATH-KIND STATUS SECONDS" to its own log.
worker() {
    local log="$1" deadline="$2" delay="$3" roll method path data
    while (($(date +%s) < deadline)); do
        roll=$((RANDOM % 100))
        data=""
        if ((!tasks_supported)); then
            if   ((roll < 30)); then method=GET; path="/api/projects"
            elif ((roll < 55)); then method=GET; path="/api/projects/$project_id"
            elif ((roll < 75)); then method=GET; path="/"
            elif ((roll < 90)); then method=GET; path="/auth/me"
            else write_project "$log"; sleep "$delay"; continue
            fi
        elif ((roll < 40)); then method=GET;  path="/api/projects/$project_id/tasks"
        elif ((roll < 55)); then method=GET;  path="/api/projects"
        elif ((roll < 65)); then method=GET;  path="/api/projects/$project_id/columns"
        elif ((roll < 75)); then method=GET;  path="/"
        elif ((roll < 85)); then method=GET;  path="/auth/me"
        elif ((roll < 95)); then method=POST; path="/api/projects/$project_id/tasks"; data="$task_body"
        else                     method=GET;  path="/api/projects/$project_id"
        fi
        if [[ -n "$data" ]]; then
            curl -s --max-time 10 -o /dev/null -w "$method ${path//$project_id/:id} %{http_code} %{time_total}\n" -b "$jar" \
                -X "$method" -H 'Content-Type: application/json' -d "$data" "$BASE_URL$path" >>"$log" || true
        else
            curl -s --max-time 10 -o /dev/null -w "$method ${path//$project_id/:id} %{http_code} %{time_total}\n" -b "$jar" \
                -X "$method" "$BASE_URL$path" >>"$log" || true
        fi
        sleep "$delay"
    done
}

delay="$(awk -v w="$WORKERS" -v r="$RPS" 'BEGIN { printf "%.3f", w / r }')"
start="$(date +%s)"
deadline=$((start + DURATION))
for i in $(seq 1 "$WORKERS"); do
    worker "$tmp/worker-$i.log" "$deadline" "$delay" &
    worker_pids+=("$!")
done
wait "${worker_pids[@]}"
worker_pids=()
elapsed=$(($(date +%s) - start))

cat "$tmp"/worker-*.log >"$tmp/all.log"
total="$(wc -l <"$tmp/all.log")"

echo
echo "sent $total requests in ${elapsed}s (~$(awk -v t="$total" -v e="$elapsed" 'BEGIN { printf "%.1f", t / e }') req/s)"
echo
echo "status:"
awk '{ c[$3]++ } END { for (s in c) printf "  %s  %d\n", s, c[s] }' "$tmp/all.log" | sort
echo
echo "latency (s):     p50    p95    max        requests"
sort -k1,2 -k4,4n "$tmp/all.log" | awk '
    # nearest-rank percentile of the sorted latencies of one METHOD+path
    function pct(key, count, p,   r) {
        r = int(p * count); if (r < p * count) r++; if (r < 1) r = 1
        return v[key, r]
    }
    { key = $1 " " $2; n[key]++; v[key, n[key]] = $4 }
    END {
        for (key in n)
            printf "  %-30s %-6.3f %-6.3f %-6.3f     %d\n", key, pct(key, n[key], 0.50), pct(key, n[key], 0.95), v[key, n[key]], n[key]
    }' | sort

server_errors="$(awk '$3 ~ /^5|^000$/ { c++ } END { print c + 0 }' "$tmp/all.log")"
if ((server_errors > 0)); then
    echo
    echo "warning: $server_errors request(s) got a 5xx or no answer -- the app is struggling at this rate" >&2
fi
