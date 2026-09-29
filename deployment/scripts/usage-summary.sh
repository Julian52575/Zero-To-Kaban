#!/usr/bin/env bash
# Summarise `kubectl top pods --no-headers` samples: for each pod, its usage in
# the idle sample and the highest usage seen in the load samples.
#
#   usage-summary.sh idle.txt load.txt
#
# Input lines look like: <pod> <cpu: 12m | 1> <memory: 45Mi | 1Gi | 900Ki>
set -euo pipefail

awk '
    function cpu(v) { return v ~ /m$/ ? v + 0 : v * 1000 }
    function mem(v) {
        if (v ~ /Gi$/) return v * 1024
        if (v ~ /Ki$/) return v / 1024
        return v + 0
    }
    FNR == 1 { file++ }
    file == 1 { idle_cpu[$1] = cpu($2); idle_mem[$1] = mem($3); pods[$1] = 1; next }
    {
        pods[$1] = 1
        if (cpu($2) > peak_cpu[$1]) peak_cpu[$1] = cpu($2)
        if (mem($3) > peak_mem[$1]) peak_mem[$1] = mem($3)
    }
    END {
        printf "  %-52s %-16s %s\n", "pod", "CPU (millicores)", "memory (MiB)"
        for (p in pods)
            printf "  %-52s %5d -> %-6d %6.0f -> %.0f\n", p, idle_cpu[p], peak_cpu[p], idle_mem[p], peak_mem[p]
    }
' "$1" "$2" | { IFS= read -r header; echo "$header"; sort; }
