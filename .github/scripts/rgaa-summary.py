#!/usr/bin/env python3
"""Merge one or more eqo rgaa.md reports into a single scannable summary.

eqo (https://github.com/kodalabs-io/eqo) writes one flat markdown file per
service (frontend, auth, ...) with a table per RGAA theme and a bullet list
per audited route. This script reshapes and MERGES any number of those
files into one report:

  - each theme's criteria table is merged across services (same criterion
    keeps its worst status: invalidated > needs-review > validated), then
    wrapped in a <details>, rows sorted failed first, then needs-review,
    then passing
  - each theme is labeled with two rates: "automated" (validated /
    (validated + invalidated), ignoring needs-review) and "global"
    (validated / (validated + invalidated + needs-review) -- how much of
    the theme is *confirmed* compliant once manual-review items are
    counted as not-yet-passing)
  - the top-level Summary table and compliance badge are recomputed from
    the merged, deduplicated 106-criterion set -- not a sum of each
    service's own numbers, which would double-count shared criteria
  - each service's routes are merged into one Issues section, labeled
    `service: /route` so it's clear which service a finding belongs to

Merging happens at the rendered-markdown level rather than eqo's own JSON:
the JSON only carries criterion/test IDs (e.g. "12.7"), while the actual
question text and issue titles for non-axe (static/custom) checks are
resolved from eqo's i18n tables only at render time -- the markdown is the
only place that text is already fully materialized, once per occurrence.

Used by the `a11y-rgaa-summary` job in
.github/workflows/frontend-and-auth-accessibility.yml:
    python3 .github/scripts/rgaa-summary.py frontend/rgaa-reports/rgaa.md auth/rgaa-reports/rgaa.md
"""
import re
import sys


def status_key(row):
    if "Invalidated" in row:
        return 0
    if "Needs review" in row:
        return 1
    if "Validated" in row:
        return 2
    return 3  # not applicable


THEME_HEADING_RE = re.compile(r"^### (\d+)\. (.+) — \d+%$")
ROW_ID_RE = re.compile(r"^\|\s*\*\*(\d+\.\d+)\*\*")
ROUTE_HEADING_RE = re.compile(r"^### `(.+)`$")
PROJECT_RE = re.compile(r"^\*\*Project:\*\*\s*(.+)$")


def find_line(lines, pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i]):
            return i
    return len(lines)


def parse_report(path):
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()

    themes_start = find_line(lines, lambda l: l.strip() == "## Themes")
    issues_start = find_line(lines, lambda l: l.strip() == "## Issues")
    footer_start = find_line(lines, lambda l: l.strip() == "---", issues_start)

    label = path
    for l in lines[:themes_start]:
        m = PROJECT_RE.match(l.strip())
        if m:
            label = m.group(1).strip()
            break

    # theme_num -> {"name": str, "rows": {criterion_id: row_text}}
    themes = {}
    i, n = themes_start, issues_start
    while i < n:
        m = THEME_HEADING_RE.match(lines[i])
        if not m:
            i += 1
            continue
        num, name = m.group(1), m.group(2)
        j = i + 1
        rows = {}
        while j < n and not THEME_HEADING_RE.match(lines[j]):
            rm = ROW_ID_RE.match(lines[j])
            if rm:
                rows[rm.group(1)] = lines[j]
            j += 1
        themes[num] = {"name": name, "rows": rows}
        i = j

    # route -> [body lines]
    routes = {}
    i, n = issues_start, footer_start
    while i < n:
        m = ROUTE_HEADING_RE.match(lines[i])
        if not m:
            i += 1
            continue
        route = m.group(1)
        j = i + 1
        body = []
        while j < n and not ROUTE_HEADING_RE.match(lines[j]):
            body.append(lines[j])
            j += 1
        while body and body[0].strip() == "":
            body.pop(0)
        while body and body[-1].strip() == "":
            body.pop()
        routes[route] = body
        i = j

    return {"label": label, "themes": themes, "routes": routes}


def merge(reports):
    theme_order = []
    merged_themes = {}
    for r in reports:
        for num, data in r["themes"].items():
            if num not in merged_themes:
                theme_order.append(num)
                merged_themes[num] = {"name": data["name"], "rows": {}}
            for crit_id, row_text in data["rows"].items():
                existing = merged_themes[num]["rows"].get(crit_id)
                if existing is None or status_key(row_text) < status_key(existing):
                    merged_themes[num]["rows"][crit_id] = row_text
    theme_order.sort(key=int)

    routes = [(r["label"], route, body) for r in reports for route, body in r["routes"].items()]

    return theme_order, merged_themes, routes


def render(theme_order, merged_themes, routes, labels):
    theme_sections = []
    total = {"validated": 0, "invalidated": 0, "needs_review": 0, "na": 0}
    for num in theme_order:
        data = merged_themes[num]
        rows = list(data["rows"].values())
        rows.sort(key=status_key)

        counts = {k: sum(1 for r in rows if status_key(r) == v)
                  for k, v in (("validated", 2), ("invalidated", 0), ("needs_review", 1), ("na", 3))}
        for k in total:
            total[k] += counts[k]

        auto_denom = counts["validated"] + counts["invalidated"]
        auto_pct = round(counts["validated"] / auto_denom * 100) if auto_denom else 100
        global_denom = auto_denom + counts["needs_review"]
        global_pct = round(counts["validated"] / global_denom * 100) if global_denom else 100
        emoji = "✅" if auto_pct == 100 else "❌"

        summary = f"{num}. {data['name']} -- {auto_pct}% (automated) {emoji} -- {global_pct}% (global)"
        theme_sections += [
            f"<details><summary>{summary}</summary>", "",
            "| Criterion | Status |", "| --- | --- |", *rows,
            "", "</details>", "",
        ]

    applicable = total["validated"] + total["invalidated"]
    compliance_pct = round(total["validated"] / applicable * 100) if applicable else 100
    badge_color = "brightgreen" if compliance_pct == 100 else "red" if compliance_pct < 90 else "yellow"

    issues_out = ["## Issues", ""]
    for label, route, body in routes:
        heading = f"`{label}: {route}`"
        count = sum(1 for l in body if re.match(r"^- (🔴|🟡|🟢)", l))
        if count == 0:
            issues_out.append(f"<details><summary>{heading} — no issues</summary></details>")
        else:
            issues_out += [f"<details open><summary>{heading} — {count} issue(s)</summary>", "", *body, "", "</details>"]
        issues_out.append("")

    out = [
        "# RGAA v4.1.2 Accessibility Report",
        "",
        f"![Compliance {compliance_pct}%](https://img.shields.io/badge/RGAA%20v4.1.2-{compliance_pct}%25-{badge_color})",
        "",
        "> Note: This report covers only automatically verifiable criteria. Criteria marked as 'Needs review' "
        "require manual inspection. The compliance rate reflects automated checks only. Merged across "
        f"{len(labels)} service(s): {', '.join(labels)}.",
        "",
        "## Summary",
        "",
        "| | |",
        "|---|---|",
        f"| Compliance rate | **{compliance_pct}%** |",
        f"| Total criteria | {sum(total.values())} |",
        f"| Applicable | {applicable} |",
        f"| Validated | {total['validated']} |",
        f"| Invalidated | {total['invalidated']} |",
        f"| Not applicable | {total['na']} |",
        f"| Needs review | {total['needs_review']} |",
        "",
        "## Themes",
        "",
        *theme_sections,
        *issues_out,
        "---",
        "*Generated by [@kodalabs-io/eqo](https://github.com/kodalabs-io/eqo) v1.0.0 -- merged across services by rgaa-summary.py*",
    ]
    return "\n".join(out) + "\n"


def shorten_labels(reports):
    """Strip a shared prefix (e.g. "zero-to-kaban-") off every report's label,
    purely for display -- doesn't touch anything used to key/merge data."""
    labels = [r["label"] for r in reports]
    if len(labels) < 2:
        return
    prefix = labels[0]
    for label in labels[1:]:
        while not label.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix:
                return
    cut = len(prefix.rstrip("-"))
    if cut == 0 or any(len(l) <= cut for l in labels):
        return
    for r in reports:
        r["label"] = r["label"][cut:].lstrip("-") or r["label"]


def main():
    paths = sys.argv[1:]
    if not paths:
        paths = ["rgaa-reports/rgaa.md"]
    reports = [parse_report(p) for p in paths]
    shorten_labels(reports)
    theme_order, merged_themes, routes = merge(reports)
    labels = [r["label"] for r in reports]
    sys.stdout.write(render(theme_order, merged_themes, routes, labels))


if __name__ == "__main__":
    main()
