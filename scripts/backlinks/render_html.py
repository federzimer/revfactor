"""Render a spreadsheet-style HTML table of every tracked backlink + history.

Writes report.html (table view, sortable, freeze header). Run with --open
to launch in browser.
"""
from __future__ import annotations
import argparse
import html
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from db import connect

OUT = Path(__file__).parent / "report.html"

GRADE_BG = {
    "A": "#16a34a", "B": "#65a30d", "C": "#ca8a04",
    "D": "#dc2626", "F": "#7f1d1d", "?": "#525252",
}


def render():
    conn = connect()
    rows = conn.execute(
        """SELECT l.id, l.url, l.domain, l.link_type, l.date_added, l.first_seen_at, l.notes,
                  c.checked_at, c.http_status, c.is_alive,
                  c.brand_mention_present, c.outbound_link_present,
                  c.rel_attr, c.is_dofollow, c.anchor_text,
                  c.quality_score, c.quality_grade, c.error
           FROM links l
           LEFT JOIN checks c ON c.id = (
             SELECT id FROM checks WHERE link_id = l.id ORDER BY checked_at DESC LIMIT 1
           )
           WHERE l.archived_at IS NULL
           ORDER BY (c.quality_score IS NULL), c.quality_score DESC, l.id"""
    ).fetchall()

    history = {}
    for r in rows:
        h = conn.execute(
            """SELECT checked_at, quality_score, quality_grade
               FROM checks WHERE link_id = ? ORDER BY checked_at DESC LIMIT 6""",
            (r["id"],),
        ).fetchall()
        history[r["id"]] = [dict(x) for x in h]
    conn.close()

    grades = {g: 0 for g in "ABCDF"}
    for r in rows:
        g = r["quality_grade"]
        if g in grades:
            grades[g] += 1

    def cell_bool(v):
        if v is None:
            return '<td class="b">—</td>'
        return f'<td class="b {"y" if v else "n"}">{"✓" if v else "✗"}</td>'

    def domain_short(d):
        return d[:30] + ("…" if len(d) > 30 else "")

    body_rows = []
    for r in rows:
        g = r["quality_grade"] or "?"
        bg = GRADE_BG.get(g, "#525252")
        score = r["quality_score"] if r["quality_score"] is not None else ""
        status = r["http_status"] if r["http_status"] is not None else ""
        url = html.escape(r["url"])
        url_disp = html.escape(r["url"][:80] + ("…" if len(r["url"]) > 80 else ""))
        anchor = html.escape((r["anchor_text"] or "")[:40])
        rel = html.escape(r["rel_attr"] or "")
        checked = (r["checked_at"] or "")[:10]

        hist = history.get(r["id"], [])
        hist_dots = "".join(
            f'<span class="d" style="background:{GRADE_BG.get(h["quality_grade"], "#525252")}" title="{h["checked_at"][:10]} · {h["quality_grade"]} · {h["quality_score"]}"></span>'
            for h in reversed(hist)
        )

        body_rows.append(f"""
        <tr>
          <td class="g" style="background:{bg}">{g}</td>
          <td class="num">{score}</td>
          <td class="num">{status}</td>
          {cell_bool(r['is_alive'])}
          {cell_bool(r['brand_mention_present'])}
          {cell_bool(r['outbound_link_present'])}
          {cell_bool(r['is_dofollow'])}
          <td class="t">{html.escape(r['link_type'] or '')}</td>
          <td class="t">{html.escape(domain_short(r['domain']))}</td>
          <td class="u"><a href="{url}" target="_blank" rel="noopener">{url_disp}</a></td>
          <td class="t">{anchor}</td>
          <td class="t">{rel or '<span class="muted">—</span>'}</td>
          <td class="t">{html.escape(r['date_added'] or '')}</td>
          <td class="t">{html.escape(checked)}</td>
          <td class="hist">{hist_dots or '<span class="muted">·</span>'}</td>
        </tr>""")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    summary = " · ".join(f"<b style='color:{GRADE_BG[g]}'>{g}={n}</b>" for g, n in grades.items())

    page = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>RevFactor backlinks</title>
<style>
  :root {{ font: 13px/1.35 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #1a1a1a; }}
  body {{ margin: 16px; background: #fafaf9; }}
  h1 {{ font: 500 18px/1 -apple-system, sans-serif; margin: 0 0 4px; }}
  .summary {{ color: #525252; margin-bottom: 14px; font-size: 12px; }}
  table {{ border-collapse: collapse; width: 100%; background: white; font-size: 12px; }}
  thead th {{ position: sticky; top: 0; background: #292524; color: #fafaf9; padding: 8px 6px;
              font: 600 10px/1 -apple-system, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;
              text-align: left; cursor: pointer; user-select: none; border: 1px solid #44403c; }}
  thead th:hover {{ background: #44403c; }}
  thead th.sort-asc::after {{ content: " ▲"; opacity: 0.7; }}
  thead th.sort-desc::after {{ content: " ▼"; opacity: 0.7; }}
  tbody td {{ padding: 6px 6px; border: 1px solid #e7e5e4; vertical-align: middle; }}
  tbody tr:nth-child(even) {{ background: #fafaf9; }}
  tbody tr:hover {{ background: #fef3c7; }}
  td.g {{ color: white; font: 700 13px/1 -apple-system, sans-serif; text-align: center; width: 28px; }}
  td.num {{ text-align: right; font-family: ui-monospace, monospace; width: 50px; }}
  td.b {{ text-align: center; width: 32px; font-family: ui-monospace, monospace; font-weight: 700; }}
  td.b.y {{ color: #15803d; }}
  td.b.n {{ color: #b91c1c; }}
  td.t {{ font-family: ui-monospace, monospace; max-width: 180px; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap; }}
  td.u {{ max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
  td.u a {{ color: #1d4ed8; text-decoration: none; }}
  td.u a:hover {{ text-decoration: underline; }}
  td.hist {{ white-space: nowrap; }}
  .d {{ display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 2px; cursor: help; }}
  .muted {{ color: #a8a29e; }}
  .legend {{ margin-top: 12px; padding: 10px 12px; background: white; border: 1px solid #e7e5e4;
            border-radius: 6px; font-size: 11px; color: #57534e; }}
  .legend code {{ background: #f5f5f4; padding: 1px 4px; border-radius: 3px; }}
</style></head>
<body>
<h1>RevFactor backlinks · {len(rows)} tracked</h1>
<div class="summary">{summary} · rendered {now[:19].replace('T', ' ')} UTC</div>

<table id="t">
  <thead><tr>
    <th data-sort="text">Grd</th>
    <th data-sort="num">Score</th>
    <th data-sort="num">HTTP</th>
    <th data-sort="text">Alive</th>
    <th data-sort="text">Brand</th>
    <th data-sort="text">Link</th>
    <th data-sort="text">DoFol</th>
    <th data-sort="text">Type</th>
    <th data-sort="text">Domain</th>
    <th data-sort="text">URL</th>
    <th data-sort="text">Anchor</th>
    <th data-sort="text">rel</th>
    <th data-sort="text">Added</th>
    <th data-sort="text">Checked</th>
    <th data-sort="text">History</th>
  </tr></thead>
  <tbody>{''.join(body_rows)}</tbody>
</table>

<div class="legend">
  <b>Score (0–100):</b> +30 alive · +25 brand mention "RevFactor" in HTML · +25 outbound link to revfactor.io · +20 dofollow.
  <b>Grades:</b> A 80+ · B 60–79 · C 40–59 · D 1–39 · F 0.
  <b>D on Medium/Reddit/Quora/Facebook</b> usually means anti-bot blocks static parsing — link is alive but mention can't be verified without JS rendering.
  <b>History dots</b> show the last 6 monthly checks (oldest left → newest right). Hover for date + grade.
  Click any column header to sort.
</div>

<script>
(function() {{
  const table = document.getElementById('t');
  const headers = table.querySelectorAll('thead th');
  headers.forEach((h, idx) => {{
    h.addEventListener('click', () => {{
      const dir = h.classList.contains('sort-asc') ? 'desc' : 'asc';
      headers.forEach(x => x.classList.remove('sort-asc', 'sort-desc'));
      h.classList.add('sort-' + dir);
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const isNum = h.dataset.sort === 'num';
      rows.sort((a, b) => {{
        let av = a.children[idx].textContent.trim();
        let bv = b.children[idx].textContent.trim();
        if (isNum) {{ av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; return dir === 'asc' ? av - bv : bv - av; }}
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }});
      rows.forEach(r => tbody.appendChild(r));
    }});
  }});
}})();
</script>
</body></html>"""

    OUT.write_text(page)
    return OUT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--open", action="store_true", help="Open in default browser after rendering")
    args = ap.parse_args()
    out = render()
    print(f"wrote {out}")
    if args.open:
        subprocess.run(["open", str(out)])


if __name__ == "__main__":
    main()
