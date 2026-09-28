#!/usr/bin/env python3
"""Reshape eqo's rgaa.md into a more scannable GitHub step summary.

eqo (https://github.com/kodalabs-io/eqo) writes one flat markdown file with
a table per RGAA theme and a bullet list per audited route. At this repo's
size that's already a lot of scrolling, so this script:

  - wraps each theme's criteria table in a <details>, sorted so failed
    criteria surface first, then needs-review, then passing ones
  - labels each theme with two rates: "automated" (validated /
    (validated + invalidated), ignoring needs-review -- same figure eqo's
    own heading already reports) and "global" (validated / (validated +
    invalidated + needs-review) -- how much of the theme is *confirmed*
    compliant once the manual-review items are counted as not-yet-passing)
  - wraps each route's issue list in a <details>

Used by the `frontend-a11y-rgaa` job in .github/workflows/frontend-accessibility.yml:
    python3 .github/scripts/rgaa-summary.py frontend/rgaa-reports/rgaa.md
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "rgaa-reports/rgaa.md"
with open(path, encoding="utf-8") as f:
    lines = f.read().splitlines()


def find_line(pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i]):
            return i
    return len(lines)


themes_start = find_line(lambda l: l.strip() == "## Themes")
issues_start = find_line(lambda l: l.strip() == "## Issues")
footer_start = find_line(lambda l: l.strip() == "---", issues_start)

header = lines[:themes_start]
themes_block = lines[themes_start:issues_start]
issues_block = lines[issues_start:footer_start]
footer = lines[footer_start:]


def status_key(row):
    if "Invalidated" in row:
        return 0
    if "Needs review" in row:
        return 1
    if "Validated" in row:
        return 2
    return 3  # not applicable


# --- Themes: one <details> per theme, rows sorted failed > review > pass ---
theme_heading_re = re.compile(r"^### (\d+)\. (.+) — \d+%$")
out_themes = ["## Themes", ""]
i, n = 0, len(themes_block)
while i < n:
    m = theme_heading_re.match(themes_block[i])
    if not m:
        i += 1
        continue
    num, name = m.group(1), m.group(2)
    j = i + 1
    table_lines = []
    while j < n and not theme_heading_re.match(themes_block[j]):
        if themes_block[j].startswith("|"):
            table_lines.append(themes_block[j])
        j += 1
    header_row, sep_row, *rows = table_lines
    rows.sort(key=status_key)

    validated = sum(1 for r in rows if status_key(r) == 2)
    invalidated = sum(1 for r in rows if status_key(r) == 0)
    needs_review = sum(1 for r in rows if status_key(r) == 1)

    auto_denom = validated + invalidated
    auto_pct = round(validated / auto_denom * 100) if auto_denom else 100
    global_denom = validated + invalidated + needs_review
    global_pct = round(validated / global_denom * 100) if global_denom else 100
    emoji = "✅" if auto_pct == 100 else "❌"

    summary = f"{num}. {name} -- {auto_pct}% (automated) {emoji} -- {global_pct}% (global)"
    out_themes += [f"<details><summary>{summary}</summary>", ""]
    out_themes += [header_row, sep_row, *rows]
    out_themes += ["", "</details>", ""]
    i = j

# --- Issues: one <details> per route ---
route_heading_re = re.compile(r"^### `(.+)`$")
out_issues = ["## Issues", ""]
i, n = 0, len(issues_block)
while i < n:
    m = route_heading_re.match(issues_block[i])
    if not m:
        i += 1
        continue
    route = m.group(1)
    j = i + 1
    body = []
    while j < n and not route_heading_re.match(issues_block[j]):
        body.append(issues_block[j])
        j += 1
    while body and body[0].strip() == "":
        body.pop(0)
    while body and body[-1].strip() == "":
        body.pop()
    count = sum(1 for l in body if re.match(r"^- (🔴|🟡|🟢)", l))
    if count == 0:
        out_issues.append(f"<details><summary>`{route}` — no issues</summary></details>")
    else:
        out_issues += [f"<details open><summary>`{route}` — {count} issue(s)</summary>", ""]
        out_issues += body
        out_issues += ["", "</details>"]
    out_issues.append("")
    i = j

sys.stdout.write("\n".join(header + out_themes + out_issues + footer) + "\n")
