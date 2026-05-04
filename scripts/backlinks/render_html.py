"""Render a readable HTML dashboard of every tracked backlink + its check history.

Writes to scripts/backlinks/report.html. Run with --open to launch in browser.
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
    links = conn.execute(
        """SELECT l.id, l.url, l.domain, l.link_type, l.date_added, l.first_seen_at, l.notes,
                  c.checked_at, c.http_status, c.is_alive,
                  c.brand_mention_present, c.outbound_link_present,
                  c.rel_attr, c.is_dofollow, c.anchor_text, c.excerpt,
                  c.quality_score, c.quality_grade, c.error
           FROM links l
           LEFT JOIN checks c ON c.id = (
             SELECT id FROM checks WHERE link_id = l.id ORDER BY checked_at DESC LIMIT 1
           )
           WHERE l.archived_at IS NULL
           ORDER BY (c.quality_score IS NULL), c.quality_score DESC, l.id"""
    ).fetchall()

    history = {}
    for row in links:
        rows = conn.execute(
            """SELECT checked_at, quality_score, quality_grade, http_status,
                      brand_mention_present, outbound_link_present, is_dofollow, error
               FROM checks WHERE link_id = ? ORDER BY checked_at DESC LIMIT 12""",
            (row["id"],),
        ).fetchall()
        history[row["id"]] = [dict(r) for r in rows]
    conn.close()

    grades = {g: 0 for g in "ABCDF"}
    for r in links:
        g = r["quality_grade"]
        if g in grades:
            grades[g] += 1

    cards = []
    for r in links:
        g = r["quality_grade"] or "?"
        bg = GRADE_BG.get(g, "#525252")
        score = r["quality_score"] if r["quality_score"] is not None else "—"
        status = r["http_status"] or "—"
        url_short = r["url"][:120] + ("…" if len(r["url"]) > 120 else "")
        anchor = html.escape(r["anchor_text"] or "")
        excerpt = html.escape(r["excerpt"] or "")
        rel = html.escape(r["rel_attr"] or "")
        notes = html.escape(r["notes"] or "")
        checked = r["checked_at"][:19].replace("T", " ") if r["checked_at"] else "never"

        hist_dots = ""
        for h in reversed(history.get(r["id"], [])):
            hg = h["quality_grade"] or "?"
            hbg = GRADE_BG.get(hg, "#525252")
            t = h["checked_at"][:10] if h["checked_at"] else ""
            hist_dots += f'<span class="dot" style="background:{hbg}" title="{t} · {hg} · {h["quality_score"]}">{hg}</span>'

        signals = []
        signals.append(f'<span class="sig {"ok" if r["is_alive"] else "bad"}">alive: {bool(r["is_alive"])}</span>')
        signals.append(f'<span class="sig {"ok" if r["brand_mention_present"] else "bad"}">brand mention: {bool(r["brand_mention_present"])}</span>')
        signals.append(f'<span class="sig {"ok" if r["outbound_link_present"] else "bad"}">outbound link: {bool(r["outbound_link_present"])}</span>')
        signals.append(f'<span class="sig {"ok" if r["is_dofollow"] else "bad"}">dofollow: {bool(r["is_dofollow"])}</span>')

        cards.append(f"""
        <article class="card">
          <header>
            <div class="grade" style="background:{bg}">{g}<small>{score}</small></div>
            <div class="meta">
              <a href="{html.escape(r['url'])}" target="_blank" rel="noopener">{html.escape(url_short)}</a>
              <div class="sub">
                <span class="pill">{html.escape(r['link_type'] or '?')}</span>
                <span class="pill">{html.escape(r['domain'])}</span>
                <span class="pill">added {html.escape(r['date_added'] or '?')}</span>
                <span class="pill">HTTP {status}</span>
                <span class="pill">checked {html.escape(checked)}</span>
              </div>
            </div>
          </header>
          <div class="signals">{''.join(signals)}</div>
          {f'<div class="anchor">anchor: <code>{anchor}</code> · rel="<code>{rel or "(none)"}</code>"</div>' if r["outbound_link_present"] else ''}
          {f'<div class="excerpt">…{excerpt}…</div>' if excerpt else ''}
          {f'<div class="notes">notes: {notes}</div>' if notes else ''}
          <div class="history">history: {hist_dots or '<em>first check</em>'}</div>
        </article>""")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    summary = " · ".join(f"<b style='color:{GRADE_BG[g]}'>{g}={n}</b>" for g, n in grades.items())

    page = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>RevFactor backlinks · {len(links)} tracked</title>
<style>
  :root {{ font: 14px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #1a1a1a; }}
  body {{ max-width: 1100px; margin: 24px auto; padding: 0 16px; background: #fafaf9; }}
  h1 {{ font-weight: 500; margin: 0 0 4px; }}
  .summary {{ color: #525252; margin-bottom: 24px; font-size: 13px; }}
  .summary b {{ font-weight: 600; }}
  .card {{ background: white; border: 1px solid #e7e5e4; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }}
  .card header {{ display: flex; gap: 14px; align-items: flex-start; }}
  .grade {{ flex-shrink: 0; width: 56px; height: 56px; border-radius: 8px; color: white; font: 700 24px/1 -apple-system, sans-serif;
           display: flex; flex-direction: column; align-items: center; justify-content: center; }}
  .grade small {{ font: 500 11px/1 ui-monospace, monospace; opacity: 0.85; margin-top: 4px; }}
  .meta {{ flex: 1; min-width: 0; }}
  .meta a {{ color: #1d4ed8; text-decoration: none; word-break: break-all; font-weight: 500; }}
  .meta a:hover {{ text-decoration: underline; }}
  .sub {{ margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }}
  .pill {{ background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 6px; padding: 1px 8px;
          font-size: 11px; color: #525252; font-family: ui-monospace, monospace; }}
  .signals {{ margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }}
  .sig {{ font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: ui-monospace, monospace; }}
  .sig.ok {{ background: #dcfce7; color: #14532d; }}
  .sig.bad {{ background: #fee2e2; color: #7f1d1d; }}
  .anchor {{ margin-top: 8px; font-size: 12px; color: #525252; }}
  .anchor code {{ background: #f5f5f4; padding: 1px 4px; border-radius: 3px; }}
  .excerpt {{ margin-top: 6px; padding: 8px 10px; background: #fafaf9; border-left: 2px solid #d6d3d1;
             font-size: 11px; color: #57534e; font-family: ui-monospace, monospace; word-break: break-word; }}
  .notes {{ margin-top: 6px; font-size: 12px; color: #78716c; font-style: italic; }}
  .history {{ margin-top: 10px; font-size: 11px; color: #78716c; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }}
  .dot {{ width: 18px; height: 18px; border-radius: 4px; color: white; font: 700 11px/18px sans-serif;
         text-align: center; cursor: help; }}
  .legend {{ margin-top: 24px; font-size: 12px; color: #78716c; padding: 12px 16px;
            background: white; border: 1px solid #e7e5e4; border-radius: 10px; }}
  .legend b {{ color: #1a1a1a; }}
</style></head>
<body>
<h1>RevFactor backlinks</h1>
<div class="summary">{len(links)} tracked · {summary} · rendered {now[:19].replace('T', ' ')} UTC</div>
{''.join(cards)}
<div class="legend">
  <b>Quality score (0–100):</b> +30 alive, +25 brand mention "RevFactor" in HTML, +25 outbound link to revfactor.io, +20 dofollow.<br>
  <b>Grades:</b> A 80+, B 60–79, C 40–59, D 1–39, F 0. <br>
  <b>D grade on Medium/Reddit/Quora/Facebook</b> usually means the URL is alive but anti-bot blocks static parsing — the brand mention is likely there but unverifiable without JS rendering.
</div>
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
