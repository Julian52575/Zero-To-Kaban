#!/usr/bin/env python3
"""Simulate a few users using the app, to see how much CPU/memory it needs.

  deployment/scripts/simulate-traffic.py [requests_per_second] [seconds]

Talks to the app through its front door (Traefik), so every request goes
through the same ForwardAuth check as a real browser, over keep-alive
connections like a browser's. It signs in once (login is rate limited to 10 per
15 min per IP, register to 5 per hour, so it never signs in per request),
creates its own project, sends a mixed read-heavy load with some writes, then
deletes the project (columns and tasks are deleted with it) and prints a
summary. Standard library only, Python 3.8+.

Env:
  BASE_URL       where Traefik listens       (default http://localhost:18080, `just up-local`;
                                              the docker-compose stack is http://localhost:$PROXY_PORT)
  RPS            target requests per second  (default 20, or the 1st argument)
  DURATION       seconds of load             (default 60, or the 2nd argument)
  WORKERS        parallel clients            (default 8)
  LOAD_USER / LOAD_PASSWORD   account to use, created on first run (default loadtest / loadtest-password)
  ALLOW_REMOTE=1 allow a BASE_URL that isn't localhost / a loopback address (never use it on prod)

Each worker sends one request every WORKERS/RPS seconds, so the target rate is
held unless the app answers slower than that; the summary prints the rate that
was actually reached.
"""
import argparse
import http.client
import ipaddress
import json
import math
import os
import random
import signal
import ssl
import sys
import threading
import time
from collections import defaultdict
from http.cookies import SimpleCookie
from urllib.parse import urlsplit

TIMEOUT = 10  # seconds, per request


class Fatal(Exception):
    """A setup problem: print it and exit 1."""


def is_local(host):
    if host == "localhost" or host.endswith(".localhost"):
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


class Client:
    """One keep-alive connection to the target, carrying the session cookie."""

    def __init__(self, base_url, cookies=None):
        parts = urlsplit(base_url)
        if parts.scheme not in ("http", "https") or not parts.hostname:
            raise Fatal("BASE_URL must look like http://host:port, got '%s'" % base_url)
        self.prefix = parts.path.rstrip("/")
        self.cookies = dict(cookies or {})
        self._make_conn = lambda: (
            http.client.HTTPSConnection(parts.hostname, parts.port, timeout=TIMEOUT, context=ssl.create_default_context())
            if parts.scheme == "https"
            else http.client.HTTPConnection(parts.hostname, parts.port, timeout=TIMEOUT)
        )
        self._conn = None

    def request(self, method, path, body=None):
        """Returns (status, body bytes, seconds). Status 0 means no answer (refused, timeout, ...)."""
        headers = {}
        if self.cookies:
            headers["Cookie"] = "; ".join("%s=%s" % kv for kv in self.cookies.items())
        payload = None
        if body is not None:
            payload = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        # A keep-alive connection the server closed while idle fails on its next
        # use; that says nothing about the app, so retry once on a fresh one.
        for attempt in (0, 1):
            reused = self._conn is not None
            if self._conn is None:
                self._conn = self._make_conn()
            started = time.perf_counter()
            try:
                self._conn.request(method, self.prefix + path, body=payload, headers=headers)
                resp = self._conn.getresponse()
                data = resp.read()
            except (OSError, http.client.HTTPException):
                self._conn.close()
                self._conn = None
                if reused and attempt == 0:
                    continue
                return 0, b"", time.perf_counter() - started
            seconds = time.perf_counter() - started
            for header in resp.msg.get_all("Set-Cookie") or []:
                jar = SimpleCookie()
                jar.load(header)
                for name, morsel in jar.items():
                    self.cookies[name] = morsel.value
            if resp.will_close:
                self._conn.close()
                self._conn = None
            return resp.status, data, seconds
        return 0, b"", 0.0  # unreachable

    def close(self):
        if self._conn is not None:
            self._conn.close()
            self._conn = None


def api(client, method, path, body=None):
    """Setup call: the parsed JSON body, or Fatal on anything but 2xx."""
    status, data, _ = client.request(method, path, body)
    if not 200 <= status < 300:
        detail = data[:300].decode(errors="replace") if status else "no answer"
        raise Fatal("%s %s answered %s: %s" % (method, path, status or "nothing", detail))
    return json.loads(data) if data else None


class Load:
    """What the workers share: the target, the project they hit, and the clock."""

    def __init__(self, base_url, cookies, project_id, project_body, task_body, workers, delay, start, deadline):
        self.base_url = base_url
        self.cookies = cookies
        self.project_id = project_id
        self.project_body = project_body
        self.task_body = task_body  # None: this backend has no tasks
        self.workers = workers
        self.delay = delay
        self.start = start
        self.deadline = deadline


def pick_action(load, rng):
    """(method, path, body) for one random request. Paths keep the real project id."""
    pid = load.project_id
    roll = rng.randrange(100)
    if load.task_body is None:  # projects-only mix
        if roll < 30:
            return "GET", "/api/projects", None
        if roll < 55:
            return "GET", "/api/projects/" + pid, None
        if roll < 75:
            return "GET", "/", None
        if roll < 90:
            return "GET", "/auth/me", None
        return "WRITE_PROJECT", None, None
    if roll < 40:
        return "GET", "/api/projects/%s/tasks" % pid, None
    if roll < 55:
        return "GET", "/api/projects", None
    if roll < 65:
        return "GET", "/api/projects/%s/columns" % pid, None
    if roll < 75:
        return "GET", "/", None
    if roll < 85:
        return "GET", "/auth/me", None
    if roll < 95:
        return "POST", "/api/projects/%s/tasks" % pid, load.task_body
    return "GET", "/api/projects/" + pid, None


def worker(index, load, records, stop):
    rng = random.Random()
    client = Client(load.base_url, load.cookies)

    def send(method, path, body=None, route=None):
        status, data, seconds = client.request(method, path, body)
        records.append((method, route or path.replace(load.project_id, ":id"), "%03d" % status, seconds))
        return status, data

    # Stagger the workers so they don't all fire on the same tick.
    next_at = load.start + index * load.delay / load.workers
    try:
        while not stop.is_set() and next_at < load.deadline:
            wait = next_at - time.monotonic()
            if wait > 0 and stop.wait(wait):
                break
            method, path, body = pick_action(load, rng)
            if method == "WRITE_PROJECT":  # create a project, then delete it again
                status, data = send("POST", "/api/projects", load.project_body)
                try:
                    created = json.loads(data).get("id") if status == 201 else None
                except ValueError:
                    created = None
                if created:
                    send("DELETE", "/api/projects/" + created, route="/api/projects/:id")
                    next_at += load.delay  # two requests: pace it as two
            else:
                send(method, path, body)
            next_at += load.delay
            now = time.monotonic()
            if next_at < now - load.delay:  # far behind: don't fire a burst to catch up
                next_at = now
    finally:
        client.close()


def percentile(sorted_values, p):
    """Nearest-rank percentile of an ascending list."""
    rank = max(1, math.ceil(p * len(sorted_values)))
    return sorted_values[rank - 1]


def print_summary(records, elapsed, target_rps=None, workers=None):
    reached = len(records) / elapsed if elapsed else 0
    print()
    print("sent %d requests in %.0fs (~%.1f req/s)" % (len(records), elapsed, reached))
    if target_rps and workers and records and reached < 0.9 * target_rps:
        average = sum(seconds for _, _, _, seconds in records) / len(records)
        print()
        print(
            "note: reached %.0f of the %d req/s target. Each worker waits for its answer before sending the next\n"
            "request, so at most WORKERS / average latency requests get sent per second (%d workers, %.0f ms average:\n"
            "~%.0f req/s). The app, or the tunnel in front of it, is the limit: more workers mostly add queueing\n"
            "(compare p50/p95 below across runs). Try WORKERS=%d, or a lower rate."
            % (reached, target_rps, workers, average * 1000, workers / average if average else 0, workers * 4)
        )
    print()
    print("status:")
    counts = defaultdict(int)
    for _, _, status, _ in records:
        counts[status] += 1
    for status in sorted(counts):
        print("  %s  %d" % (status, counts[status]))
    print()
    by_route = defaultdict(list)
    for method, route, _, seconds in records:
        by_route[method + " " + route].append(seconds)
    # One format for the header and the rows, so the columns always line up.
    width = max([len("route")] + [len(key) for key in by_route])
    row = "  %-" + str(width) + "s %8s %8s %8s %9s"
    print("latency (seconds):")
    print(row % ("route", "p50", "p95", "max", "requests"))
    for key in sorted(by_route):
        values = sorted(by_route[key])
        print(row % (key, "%.3f" % percentile(values, 0.50), "%.3f" % percentile(values, 0.95), "%.3f" % values[-1], len(values)))
    failures = sum(n for status, n in counts.items() if status.startswith("5") or status == "000")
    if failures:
        print(file=sys.stderr)
        print("warning: %d request(s) got a 5xx or no answer -- the app is struggling at this rate" % failures, file=sys.stderr)


def positive_int(name, value):
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = 0
    if number < 1:
        raise Fatal("%s must be a positive integer, got '%s'" % (name, value))
    return number


def run(args):
    base_url = os.environ.get("BASE_URL", "http://localhost:18080").rstrip("/")
    rps = positive_int("RPS", args.rps if args.rps is not None else os.environ.get("RPS", "20"))
    duration = positive_int("DURATION", args.seconds if args.seconds is not None else os.environ.get("DURATION", "60"))
    workers = positive_int("WORKERS", os.environ.get("WORKERS", "8"))
    credentials = {
        "username": os.environ.get("LOAD_USER", "loadtest"),
        "password": os.environ.get("LOAD_PASSWORD", "loadtest-password"),
    }

    # This registers an account with a well-known password and hammers the
    # target, so it refuses anything but a local address unless told otherwise.
    # Never aim it at prod.
    host = urlsplit(base_url).hostname or ""
    if not is_local(host) and os.environ.get("ALLOW_REMOTE") != "1":
        raise Fatal(
            "%s is not a local address. This script creates an account with a public password and generates load; "
            "only run it against a dev app you own. Set ALLOW_REMOTE=1 to override." % base_url
        )

    print("target: %s  (~%d req/s for %ds, %d workers)" % (base_url, rps, duration, workers))
    main = Client(base_url)
    project_id = None
    stop = threading.Event()
    threads = []
    try:
        # /login is public and served by the auth service; /healthz isn't routed at the edge.
        status, _, _ = main.request("GET", "/login")
        if not 200 <= status < 400:
            raise Fatal("%s/login is not answering -- is the app up? (just up-local, or docker compose up)" % base_url)

        # Sign in, or create the account on the first run.
        status, _, _ = main.request("POST", "/auth/login", credentials)
        if status == 401:
            api(main, "POST", "/auth/register", credentials)
        elif status == 429:
            raise Fatal("login is rate limited (10 per 15 min per IP); wait, or restart the auth service")
        elif status != 200:
            raise Fatal("login answered %s" % (status or "nothing"))

        project_body = {"name": "loadtest-%d" % time.time()}
        project_id = api(main, "POST", "/api/projects", project_body)["id"]

        # An older backend image (e.g. a stale hand-built tag) has projects but no
        # columns/tasks. A 404 means "not there": fall back to a projects-only mix.
        # Any other failure is a real error.
        status, data, _ = main.request("GET", "/api/projects/%s/columns" % project_id)
        task_body = None
        if 200 <= status < 300:
            task_body = {"title": "simulated task", "description": "created by simulate-traffic.py", "columnId": json.loads(data)[0]["id"]}
            api(main, "POST", "/api/projects/%s/tasks" % project_id, task_body)
        elif status == 404:
            print("note: this backend has no tasks/columns endpoints (older image?), so tasks are left out of the mix; writes are project create+delete instead")
        else:
            raise Fatal("GET /api/projects/%s/columns answered %s" % (project_id, status or "nothing"))

        start = time.monotonic()
        load = Load(base_url, main.cookies, project_id, project_body, task_body, workers, workers / rps, start, start + duration)
        all_records = [[] for _ in range(workers)]
        threads = [threading.Thread(target=worker, args=(i, load, all_records[i], stop), daemon=True) for i in range(workers)]
        for thread in threads:
            thread.start()
        for thread in threads:
            while thread.is_alive():
                thread.join(0.5)  # short joins so Ctrl-C is handled promptly
        print_summary([r for records in all_records for r in records], time.monotonic() - start, rps, workers)
    finally:
        # Delete what we created, even when interrupted.
        stop.set()
        for thread in threads:
            thread.join(TIMEOUT + 1)
        if project_id:
            status, _, _ = main.request("DELETE", "/api/projects/" + project_id)
            if not 200 <= status < 300:
                print("warning: could not delete the simulated project %s (answered %s); delete it by hand" % (project_id, status or "nothing"), file=sys.stderr)
        main.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("Env:")[0].strip(), formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog="Environment: BASE_URL, RPS, DURATION, WORKERS, LOAD_USER, LOAD_PASSWORD, ALLOW_REMOTE (see the top of this file).")
    parser.add_argument("rps", nargs="?", help="target requests per second (default 20)")
    parser.add_argument("seconds", nargs="?", help="seconds of load (default 60)")
    args = parser.parse_args()
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        run(args)
    except Fatal as err:
        print("error: %s" % err, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130
    return 0


if __name__ == "__main__":
    sys.exit(main())
