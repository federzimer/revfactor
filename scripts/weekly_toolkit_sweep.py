#!/usr/bin/env python3
"""Weekly RevFactor seo-toolkit sweep.

Runs Sunday evenings via launchd (com.revfactor.weekly-sweep) so the team has
fresh optimization targets Monday morning.

Per URL (from the live sitemap index):  ai-eligibility, cqf, passages, receipts
Site-level (once per run):              sitemap-hygiene, signal-conflicts,
                                        bing-index, crawl-budget

Output: docs/reports/weekly-sweep-YYYY-MM-DD.md  (top-5 worst pages ranked on
DETERMINISTIC metrics only — inline_citability, receipts score, failed-passage
count, cqf; the non-deterministic ai-eligibility fanout check never gates).

Delivery: git commit (repo post-commit hook auto-pushes; rebase-and-retry once
on reject) + SMS summary + heartbeat file. Any failure SMSes the error tail.

Dry run (no git, no SMS, report to scripts/logs/):
    python3 weekly_toolkit_sweep.py --dry-run --limit 3
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------- constants
REPO = Path("/Users/aaronwhittaker/Claude/RevFactor")
TOOLKIT_DIR = Path("/Users/aaronwhittaker/Claude/seo-toolkit")
# The toolkit's own venv carries its deps (bs4 etc.) — system python3 does not.
_VENV_PY = TOOLKIT_DIR / ".venv" / "bin" / "python3"
TOOLKIT_PY = str(_VENV_PY) if _VENV_PY.exists() else "python3"
SCRIPTS = REPO / "scripts"
REPORT_DIR = REPO / "docs" / "reports"
LOG_DIR = SCRIPTS / "logs"
HEARTBEAT = SCRIPTS / ".weekly_sweep_last_success"
BING_HISTORY = SCRIPTS / ".bing_index_history.json"
SMS_SH = Path("/Users/aaronwhittaker/Claude/personal-automation/send-sms.sh")

SITE = "https://www.revfactor.io"
DOMAIN = "www.revfactor.io"
SITEMAP_INDEX = f"{SITE}/sitemap-index.xml"

PER_TOOL_TIMEOUT = 120          # seconds per tool per URL (skip on breach)
TOTAL_BUDGET = 45 * 60          # whole run must stay under ~45 min
SITE_LEVEL_RESERVE = 8 * 60     # keep this much budget for site-level + report

UA = "Mozilla/5.0 (compatible; RevFactorWeeklySweep/1.0)"

LOG_LINES: list[str] = []


def log(msg: str) -> None:
    line = f"[{dt.datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    LOG_LINES.append(line)


# ---------------------------------------------------------------- toolkit env
def toolkit_env() -> dict[str, str]:
    """Inject Doppler secrets ONCE (seo-toolkit/dev); fall back to current env."""
    try:
        out = subprocess.run(
            ["doppler", "run", "-p", "seo-toolkit", "-c", "dev", "--",
             TOOLKIT_PY, "-c", "import json,os;print(json.dumps(dict(os.environ)))"],
            capture_output=True, text=True, timeout=60, cwd=str(TOOLKIT_DIR),
        )
        if out.returncode == 0:
            env = json.loads(out.stdout.strip().splitlines()[-1])
            log("doppler env injected")
            return env
        log(f"WARN doppler env failed (rc={out.returncode}): {out.stderr.strip()[:200]}")
    except Exception as e:  # noqa: BLE001
        log(f"WARN doppler env failed: {e}")
    return dict(os.environ)


def run_tool(env: dict[str, str], subcmd: list[str],
             timeout: int = PER_TOOL_TIMEOUT) -> tuple[bool, dict | list | None, str]:
    """Run one seo-toolkit subcommand with --json capture. Returns (ok, json, err)."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        json_path = tf.name
    argv = ["seo-toolkit"] + subcmd + ["--json", json_path]
    code = f"import sys; sys.argv={argv!r}; from seo_toolkit.cli import main; sys.exit(main())"
    try:
        proc = subprocess.run(
            [TOOLKIT_PY, "-c", code], capture_output=True, text=True,
            timeout=timeout, cwd=str(TOOLKIT_DIR), env=env,
        )
        data = None
        p = Path(json_path)
        if p.exists() and p.stat().st_size:
            try:
                data = json.loads(p.read_text())
            except Exception:  # noqa: BLE001
                data = None
        err = (proc.stderr or "").strip()[-400:]
        # Tools like bing-index exit 1 on a *finding* (deindex event) while
        # still producing JSON — treat "has JSON" as success.
        ok = data is not None
        if not ok:
            err = err or f"rc={proc.returncode}, no JSON produced"
        return ok, data, ("" if ok else err)
    except subprocess.TimeoutExpired:
        return False, None, f"timeout after {timeout}s"
    except Exception as e:  # noqa: BLE001
        return False, None, str(e)
    finally:
        Path(json_path).unlink(missing_ok=True)


# ---------------------------------------------------------------- sitemap
def fetch(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def sitemap_urls(index_url: str) -> list[str]:
    """Pull every page URL from the sitemap index, recursing child sitemaps."""
    seen: set[str] = set()
    pages: list[str] = []

    def walk(sm_url: str, depth: int = 0) -> None:
        if sm_url in seen or depth > 3:
            return
        seen.add(sm_url)
        xml = fetch(sm_url)
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)
        if "<sitemapindex" in xml:
            for loc in locs:
                walk(loc, depth + 1)
        else:
            for loc in locs:
                if loc not in pages:
                    pages.append(loc)

    walk(index_url)
    return pages


# ---------------------------------------------------------------- metrics
def get_check(ai_json: dict | None, name: str) -> dict | None:
    for c in (ai_json or {}).get("surfaces", []):
        if c.get("name") == name:
            return c
    return None


def collect_page(env: dict[str, str], url: str) -> dict:
    """Run the 4 per-URL tools; extract deterministic metrics + recommendations."""
    page: dict = {"url": url, "errors": {}, "recs": []}

    ok, ai, err = run_tool(env, ["ai-eligibility", "--url", url])
    if ok:
        ic = get_check(ai, "inline_citability")
        page["inline_citability"] = ic.get("score") if ic else None
        # Every DETERMINISTIC surface's recommendations; fanout_coverage is
        # non-deterministic (LLM) and must never gate — excluded entirely.
        # Surfaces the tool marks not-applicable to this page type are skipped.
        for c in ai.get("surfaces", []):
            if c.get("name") == "fanout_coverage" or not c.get("applicable", True):
                continue
            page["recs"] += [f"[ai-eligibility/{c.get('name')}] {r}"
                             for r in c.get("recommendations", [])]
    else:
        page["errors"]["ai-eligibility"] = err

    ok, cq, err = run_tool(env, ["cqf", "--url", url])
    if ok:
        page["cqf"] = cq.get("score")
        page["recs"] += [f"[cqf] {r}" for r in cq.get("recommendations", [])]
    else:
        page["errors"]["cqf"] = err

    ok, ps, err = run_tool(env, ["passages", "--url", url])
    if ok:
        page["passages_score"] = ps.get("score")
        total = ps.get("passages_total") or 0
        citable = ps.get("passages_citable") or 0
        page["failed_passages"] = max(0, total - citable)
        page["passages_total"] = total
        page["recs"] += [f"[passages] {r}" for r in ps.get("recommendations", [])]
    else:
        page["errors"]["passages"] = err

    ok, rc, err = run_tool(env, ["receipts", "--url", url])
    if ok and not rc.get("error"):
        page["receipts"] = rc.get("score")
        page["recs"] += [f"[receipts] {r}" for r in rc.get("recommendations", [])]
    else:
        page["errors"]["receipts"] = err or (rc or {}).get("error", "unknown")

    # Priority: higher = worse = optimize first. Deterministic inputs only.
    ic = page.get("inline_citability")
    rcpt = page.get("receipts")
    fp = page.get("failed_passages")
    cqf = page.get("cqf")
    page["partial"] = any(v is None for v in (ic, rcpt, fp, cqf))
    page["priority"] = round(
        (100 - (ic if ic is not None else 50)) * 1.0
        + (100 - (rcpt if rcpt is not None else 50)) * 1.0
        + (fp if fp is not None else 3) * 8.0
        + (100 - (cqf if cqf is not None else 50)) * 0.5, 1)
    return page


# ---------------------------------------------------------------- site-level
def collect_site(env: dict[str, str], dry_run: bool) -> dict:
    site: dict = {"errors": {}}

    ok, sh, err = run_tool(env, ["sitemap-hygiene", "--sitemap", SITEMAP_INDEX],
                           timeout=PER_TOOL_TIMEOUT * 2)
    site["sitemap_hygiene"] = sh if ok else None
    if not ok:
        site["errors"]["sitemap-hygiene"] = err

    ok, sg, err = run_tool(env, ["signal-conflicts", "--url", SITE + "/"])
    site["signal_conflicts"] = sg if ok else None
    if not ok:
        site["errors"]["signal-conflicts"] = err

    bi_cmd = ["bing-index", "--domain", DOMAIN]
    if dry_run:
        bi_cmd.append("--no-record")   # don't pollute snapshot history
    ok, bi, err = run_tool(env, bi_cmd)
    site["bing_index"] = bi if ok else None
    if not ok:
        site["errors"]["bing-index"] = err

    ok, cb, err = run_tool(env, ["crawl-budget", "--sitemap", SITEMAP_INDEX],
                           timeout=PER_TOOL_TIMEOUT * 2)
    site["crawl_budget"] = cb if ok else None
    if not ok:
        site["errors"]["crawl-budget"] = err
    return site


def bing_trend(bi: dict | None, dry_run: bool) -> str:
    """Maintain our own weekly history file and render a trend line."""
    hist: list[dict] = []
    if BING_HISTORY.exists():
        try:
            hist = json.loads(BING_HISTORY.read_text())
        except Exception:  # noqa: BLE001
            hist = []
    today = dt.date.today().isoformat()
    if bi is not None and bi.get("error") in (None, ""):
        entry = {"date": today, "count": bi.get("indexed_count", 0)}
        if not dry_run:
            hist = [h for h in hist if h.get("date") != today] + [entry]
            BING_HISTORY.write_text(json.dumps(hist, indent=1))
        else:
            hist = hist + [entry]     # show it in the report, don't persist
    if not hist:
        return "(no history yet)"
    tail = hist[-8:]
    return " -> ".join(f"{h['date']}: {h['count']}" for h in tail)


# ---------------------------------------------------------------- report
def esc(s: str) -> str:
    return s.replace("|", "\\|")


def short(url: str) -> str:
    return url.replace(SITE, "") or "/"


def fmt(v) -> str:
    return "—" if v is None else str(v)


def build_report(pages: list[dict], site: dict, skipped: list[str],
                 started: float, dry_run: bool) -> str:
    today = dt.date.today().isoformat()
    ranked = sorted(pages, key=lambda p: p["priority"], reverse=True)
    top5 = ranked[:5]
    mins = (time.time() - started) / 60

    L: list[str] = []
    L.append(f"# RevFactor Weekly Toolkit Sweep — {today}")
    L.append("")
    L.append(f"- Pages scanned: **{len(pages)}**"
             + (f" (skipped {len(skipped)} on runtime budget)" if skipped else ""))
    L.append(f"- Runtime: {mins:.1f} min" + ("  · DRY RUN" if dry_run else ""))
    L.append("- Ranking uses deterministic metrics only: inline_citability, "
             "receipts score, failed-passage count, CQF. The ai-eligibility "
             "fanout check (LLM, non-deterministic) never gates.")
    L.append("- Priority = (100−inline_citability) + (100−receipts) + "
             "8×failed_passages + 0.5×(100−cqf); higher = fix first.")
    L.append("")

    L.append("## Top 5 pages to optimize this week")
    L.append("")
    L.append("| # | Page | Priority | Inline citability | Receipts | Failed passages | CQF |")
    L.append("|---|------|----------|-------------------|----------|-----------------|-----|")
    for i, p in enumerate(top5, 1):
        flag = " *" if p["partial"] else ""
        L.append(f"| {i} | {esc(short(p['url']))}{flag} | {p['priority']} | "
                 f"{fmt(p.get('inline_citability'))} | {fmt(p.get('receipts'))} | "
                 f"{fmt(p.get('failed_passages'))} | {fmt(p.get('cqf'))} |")
    if any(p["partial"] for p in top5):
        L.append("")
        L.append("`*` = one or more tools errored on this page; missing metrics "
                 "scored at a neutral 50.")
    L.append("")

    L.append("## Concrete fixes (from the tools' own recommendations)")
    for i, p in enumerate(top5, 1):
        L.append("")
        L.append(f"### {i}. {short(p['url'])}")
        seen: set[str] = set()
        recs = [r for r in p["recs"] if not (r in seen or seen.add(r))][:8]
        for r in recs:
            L.append(f"- {r}")
        if not recs:
            L.append("- (no recommendations returned)")
        for tool, err in p["errors"].items():
            L.append(f"- ⚠ `{tool}` errored: {err}")
    L.append("")

    L.append("## Site-level flags")
    L.append("")
    sh = site.get("sitemap_hygiene")
    if sh:
        L.append(f"- **Sitemap hygiene**: score {sh.get('hygiene_score')}/100 — "
                 + "; ".join(sh.get("summary", [])[:3]))
    sg = site.get("signal_conflicts")
    if sg:
        verdict = sg.get("verdict", "?")
        L.append(f"- **Signal conflicts (homepage)**: {verdict}"
                 + ("" if verdict == "CONSISTENT" else
                    " — " + "; ".join(sg.get("conflicts", []))))
    cb = site.get("crawl_budget")
    if cb:
        L.append(f"- **Crawl budget**: efficiency {cb.get('efficiency_score')}% "
                 f"({cb.get('supporting_304')}/{cb.get('urls_checked')} support 304; "
                 f"{cb.get('ttfb_warn_or_fail')} TTFB warn/fail)")
    bi = site.get("bing_index")
    if bi:
        line = f"- **Bing index**: {bi.get('indexed_count')} URLs indexed"
        if bi.get("delta") is not None:
            line += f" (Δ {bi['delta']:+d} vs last snapshot)"
        if bi.get("deindex_event"):
            line += " — ⚠ PROBABLE DEINDEX EVENT"
        L.append(line)
    for tool, err in site.get("errors", {}).items():
        L.append(f"- ⚠ `{tool}` errored: {err}")
    L.append("")
    L.append(f"**Bing indexed count trend**: {site.get('bing_trend', '(n/a)')}")
    L.append("")

    L.append("## Full ranking")
    L.append("")
    L.append("| Page | Priority | Inline cit. | Receipts | Failed passages | CQF |")
    L.append("|------|----------|-------------|----------|-----------------|-----|")
    for p in ranked:
        L.append(f"| {esc(short(p['url']))} | {p['priority']} | "
                 f"{fmt(p.get('inline_citability'))} | {fmt(p.get('receipts'))} | "
                 f"{fmt(p.get('failed_passages'))} | {fmt(p.get('cqf'))} |")
    if skipped:
        L.append("")
        L.append("### Skipped on runtime budget")
        for u in skipped:
            L.append(f"- {u}")
    L.append("")
    return "\n".join(L)


# ---------------------------------------------------------------- delivery
def git(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(REPO)] + args,
                          capture_output=True, text=True, timeout=180)


def commit_and_push(report_path: Path) -> None:
    rel = [str(report_path.relative_to(REPO))]
    if BING_HISTORY.exists():
        rel.append(str(BING_HISTORY.relative_to(REPO)))
    msg = f"Weekly toolkit sweep report {dt.date.today().isoformat()}"

    # Reports must land on main even if the checkout is parked on a feature
    # branch (the 2026-08-16 report was stranded on content/best-airbnb-rm-listicle).
    branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    if branch != "main":
        _commit_to_main_detached(rel, msg)
        return

    git(["add", "--"] + rel)
    c = git(["commit", "-m", msg, "--"] + rel)   # post-commit hook auto-pushes
    if c.returncode != 0:
        raise RuntimeError(f"git commit failed: {c.stderr.strip()[-300:]}")
    log("committed report (post-commit hook pushes)")

    # Verify the push actually landed; on reject: fetch + rebase + retry ONCE.
    branch = git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    git(["fetch", "origin", branch])
    local = git(["rev-parse", "HEAD"]).stdout.strip()
    remote = git(["rev-parse", f"origin/{branch}"]).stdout.strip()
    if local != remote:
        log("push not reflected on remote — rebasing and retrying once")
        r = git(["rebase", "--autostash", f"origin/{branch}"])
        if r.returncode != 0:
            git(["rebase", "--abort"])
            raise RuntimeError(f"git rebase failed: {r.stderr.strip()[-300:]}")
        pu = git(["push", "origin", branch])
        if pu.returncode != 0:
            raise RuntimeError(f"git push retry failed: {pu.stderr.strip()[-300:]}")
        log("rebase + push retry succeeded")
    else:
        log("push verified on remote")


def _commit_to_main_detached(rel: list[str], msg: str) -> None:
    """Commit rel (from the working tree) onto main + push, without touching
    the currently checked-out branch or the working tree."""
    f = git(["fetch", "origin", "main"])
    if f.returncode != 0:
        raise RuntimeError(f"git fetch origin main failed: {f.stderr.strip()[-300:]}")
    idx = REPO / ".git" / "sweep-index"
    env = {**os.environ, "GIT_INDEX_FILE": str(idx)}

    def giti(args: list[str]) -> subprocess.CompletedProcess:
        return subprocess.run(["git", "-C", str(REPO)] + args,
                              capture_output=True, text=True, timeout=180, env=env)

    try:
        giti(["read-tree", "origin/main"])
        a = giti(["add", "--"] + rel)
        if a.returncode != 0:
            raise RuntimeError(f"git add (temp index) failed: {a.stderr.strip()[-300:]}")
        tree = giti(["write-tree"]).stdout.strip()
        c = giti(["commit-tree", tree, "-p", "origin/main", "-m", msg])
        if c.returncode != 0:
            raise RuntimeError(f"git commit-tree failed: {c.stderr.strip()[-300:]}")
        commit = c.stdout.strip()
    finally:
        idx.unlink(missing_ok=True)

    p = git(["push", "origin", f"{commit}:refs/heads/main"])
    if p.returncode != 0:
        raise RuntimeError(f"git push to main failed: {p.stderr.strip()[-300:]}")
    log(f"checkout was not on main — report committed straight to origin/main ({commit[:8]})")


def send_sms(body: str) -> None:
    try:
        subprocess.run(["/bin/bash", str(SMS_SH), body],
                       capture_output=True, text=True, timeout=60)
    except Exception as e:  # noqa: BLE001
        log(f"WARN sms failed: {e}")


# ---------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="No git, no SMS, no history writes; report to scripts/logs/")
    ap.add_argument("--limit", type=int, default=None,
                    help="Only scan the first N sitemap URLs")
    args = ap.parse_args()

    started = time.time()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    try:
        env = toolkit_env()

        urls = sitemap_urls(SITEMAP_INDEX)
        log(f"sitemap: {len(urls)} URLs")
        if args.limit:
            urls = urls[: args.limit]
            log(f"limit: scanning first {len(urls)}")

        pages: list[dict] = []
        skipped: list[str] = []
        for u in urls:
            if time.time() - started > TOTAL_BUDGET - SITE_LEVEL_RESERVE:
                skipped = urls[len(pages):]
                log(f"runtime budget reached — skipping {len(skipped)} URLs")
                break
            log(f"scanning {u}")
            pages.append(collect_page(env, u))

        log("site-level checks")
        site = collect_site(env, args.dry_run)
        site["bing_trend"] = bing_trend(site.get("bing_index"), args.dry_run)

        report = build_report(pages, site, skipped, started, args.dry_run)
        today = dt.date.today().isoformat()
        if args.dry_run:
            report_path = LOG_DIR / f"weekly-sweep-dryrun-{today}.md"
            report_path.write_text(report)
            log(f"DRY RUN report -> {report_path}")
        else:
            report_path = REPORT_DIR / f"weekly-sweep-{today}.md"
            report_path.write_text(report)
            log(f"report -> {report_path}")
            commit_and_push(report_path)
            top = sorted(pages, key=lambda p: p["priority"], reverse=True)[:1]
            top_line = (f"top: {short(top[0]['url'])} (priority {top[0]['priority']})"
                        if top else "no pages scanned")
            send_sms("RevFactor weekly sweep done: "
                     f"{len(pages)} pages, {top_line}\n"
                     f"Report: {report_path}")
            HEARTBEAT.write_text(dt.datetime.now().isoformat())
            log("heartbeat written")
        return 0

    except Exception as e:  # noqa: BLE001
        import traceback
        tb = traceback.format_exc()
        log(f"FAILED: {e}")
        print(tb, file=sys.stderr)
        if not args.dry_run:
            tail = (tb.strip().splitlines()[-1] if tb else str(e))[:300]
            send_sms(f"RevFactor weekly sweep FAILED: {tail}\n"
                     f"Log tail: {' | '.join(LOG_LINES[-3:])[:600]}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
