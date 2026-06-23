#!/usr/bin/env python3
"""
RevFactor Brain: Daily Scanner

Fetches new TikTok and Instagram videos from Federico's accounts, transcribes
them with Gemini 2.5 Flash, appends to the RevFactor brain. Maintains state in
seen_ids.json so it only processes new content.

Runs daily via launchd (com.revfactor.brain-scan).

Gemini API key is loaded from macOS Keychain (service: gemini-revfactor).
Set with: security add-generic-password -a "$USER" -s gemini-revfactor -w 'KEY' -U
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from google import genai
from google.genai import types

REVFACTOR_ROOT = Path("/Users/aaronwhittaker/Claude/RevFactor")
TIKTOK_DIR = REVFACTOR_ROOT / "tiktok_videos"
TIKTOK_TRANSCRIPTS = TIKTOK_DIR / "transcripts"
IG_DIR = REVFACTOR_ROOT / "instagram_videos"
IG_TRANSCRIPTS = IG_DIR / "transcripts"
STATE_FILE = REVFACTOR_ROOT / "scripts" / "seen_ids.json"
LOG_FILE = Path("/tmp/revfactor-scan.log")

# Grace's TikTok pulls land here. We append our audio transcript to her
# markdown summary if it exists (cross-pollination, append-only — never
# overwrite Grace's content).
GRACE_TIKTOK_DIR = Path("/Users/aaronwhittaker/Claude/grace-brains/clients/revfactor/tiktok")

TIKTOK_HANDLE = "federicozimerman"
INSTAGRAM_HANDLE = "federico.zimerman"
TIKTOK_URL = f"https://www.tiktok.com/@{TIKTOK_HANDLE}"
INSTAGRAM_URL = f"https://www.instagram.com/{INSTAGRAM_HANDLE}/"

GEMINI_MODEL = "gemini-2.5-flash"

FFMPEG = "/opt/homebrew/bin/ffmpeg" if Path("/opt/homebrew/bin/ffmpeg").exists() else "ffmpeg"

for d in (TIKTOK_DIR, TIKTOK_TRANSCRIPTS, IG_DIR, IG_TRANSCRIPTS, STATE_FILE.parent):
    d.mkdir(parents=True, exist_ok=True)


def _keychain(service: str) -> str:
    """Pull a secret from macOS Keychain by service name. Returns '' if not found."""
    try:
        result = subprocess.run(
            ["security", "find-generic-password",
             "-a", os.environ.get("USER", ""),
             "-s", service, "-w"],
            capture_output=True, text=True, check=True,
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def load_gemini_key() -> str:
    """Read Gemini API key from macOS Keychain (preferred) or env var (fallback)."""
    key = _keychain("gemini-revfactor")
    if key:
        return key
    env_key = os.environ.get("GEMINI_API_KEY")
    if env_key:
        return env_key
    raise RuntimeError(
        "No Gemini API key found. Add to Keychain: "
        "security add-generic-password -a \"$USER\" -s gemini-revfactor -w 'KEY' -U"
    )


GEMINI_API_KEY = load_gemini_key()
_client = genai.Client(api_key=GEMINI_API_KEY)


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def slack_alert(msg):
    """Post to the procloser-seo-autopilot Slack webhook (shared infra).
    Best-effort — never fails the run. Pulled lazily so the import path
    doesn't break in environments without curl."""
    import urllib.request, urllib.error
    try:
        # Pull SLACK_WEBHOOK_URL from Render API (same pattern as seo-toolkit cron)
        # Cached after first call to avoid hitting Render every time.
        global _SLACK_WEBHOOK_URL
        if not globals().get("_SLACK_WEBHOOK_URL"):
            render_key = os.environ.get("RENDER_API_KEY") or _keychain("render-api-key")
            if not render_key:
                return  # no key, skip Slack notify

            req = urllib.request.Request(
                "https://api.render.com/v1/services/crn-d7nq17rrjlhs73am48fg/env-vars?limit=50",
                headers={"Authorization": f"Bearer {render_key}"})
            data = json.loads(urllib.request.urlopen(req, timeout=10).read())
            for e in data:
                if e["envVar"]["key"] == "SLACK_WEBHOOK_URL":
                    _SLACK_WEBHOOK_URL = e["envVar"]["value"]
                    break
        if not globals().get("_SLACK_WEBHOOK_URL"):
            return
        body = json.dumps({"text": msg}).encode()
        req = urllib.request.Request(_SLACK_WEBHOOK_URL, data=body,
                                     headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        log(f"  [slack] alert failed: {e}")


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"tiktok": [], "instagram": []}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def transcribe_with_gemini(audio_path: Path) -> str:
    """Upload audio to Gemini and return transcript text."""
    uploaded = _client.files.upload(file=str(audio_path))
    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            "Transcribe this audio verbatim. Output only the spoken words, no commentary. "
            "If there is no speech, output exactly: [NO SPEECH]",
            uploaded,
        ],
    )
    return (response.text or "").strip()


def list_tiktok_videos():
    try:
        result = subprocess.run(
            ["python3", "-m", "yt_dlp", "--flat-playlist",
             "--print", "%(id)s|%(duration)s|%(timestamp)s|%(title)s",
             "--no-warnings", TIKTOK_URL],
            capture_output=True, text=True, timeout=180,
        )
        videos = []
        for line in result.stdout.strip().split("\n"):
            if "|" in line:
                parts = line.split("|", 3)
                if len(parts) == 4 and parts[0]:
                    videos.append({
                        "id": parts[0], "duration": parts[1],
                        "timestamp": parts[2], "title": parts[3],
                    })
        return videos
    except Exception as e:
        log(f"TikTok list error: {e}")
        return []


def _ytdlp_with_browser_cookies(browser: str):
    """Try yt-dlp with cookies from a specific browser. Returns [] on failure."""
    try:
        result = subprocess.run(
            ["python3", "-m", "yt_dlp", "--flat-playlist",
             "--print", "%(id)s|%(title)s",
             "--cookies-from-browser", browser,
             "--no-warnings", INSTAGRAM_URL],
            capture_output=True, text=True, timeout=180,
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()[-200:]
            log(f"  yt-dlp ({browser} cookies): rc={result.returncode} stderr={stderr}")
            return []
        posts = []
        for line in result.stdout.strip().split("\n"):
            if "|" in line:
                parts = line.split("|", 1)
                if len(parts) == 2 and parts[0]:
                    posts.append({"id": parts[0], "title": parts[1]})
        return posts
    except Exception as e:
        log(f"  yt-dlp ({browser} cookies) error: {e}")
        return []


def _apify_instagram(apify_token: str):
    """Call Apify's Instagram Profile Scraper. Returns [] on failure.

    The actor returns one item per username — the profile — with a nested
    `latestPosts` array. We extract shortcodes from there. Cost: ~$0.40 per
    profile call (well within the $5/mo free tier for daily runs)."""
    import urllib.request, urllib.error
    try:
        url = f"https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token={apify_token}&clean=true&format=json"
        payload = json.dumps({
            "usernames": [INSTAGRAM_HANDLE],
            "resultsType": "posts",
            "resultsLimit": 12,
        }).encode()
        req = urllib.request.Request(url, data=payload,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read())
        if not data:
            return []
        # Actor returns one profile item per username; posts are nested.
        latest_posts = data[0].get("latestPosts") or []
        posts = []
        for p in latest_posts[:12]:
            shortcode = p.get("shortCode") or ""
            if not shortcode:
                continue
            caption = (p.get("caption") or "")[:80]
            posts.append({"id": shortcode, "title": caption})
        return posts
    except Exception as e:
        log(f"  Apify path error: {e}")
        return []


def list_instagram_posts():
    """List recent IG posts. Tries multiple auth paths in order:

      1. yt-dlp + Chrome cookies (free; needs Aaron logged into IG in Chrome)
      2. yt-dlp + Safari cookies (free; needs Aaron logged into IG in Safari)
      3. yt-dlp + Firefox cookies (free; if Firefox is installed)
      4. Apify Instagram Profile Scraper (paid ~$0.50/run; needs
         `apify-instagram` keychain entry with the token)
      5. instaloader anonymous (free; almost always 403'd in 2026)
      6. yt-dlp anonymous (free; usually 403'd in 2026)

    Returns the first path that yields posts. Empty list if all fail.
    Logs which path succeeded so Aaron can see the auth state from logs."""

    # Path 1-3: browser-cookie paths (preferred — zero new credentials)
    for browser in ("chrome", "safari", "firefox"):
        posts = _ytdlp_with_browser_cookies(browser)
        if posts:
            log(f"  [Instagram] success via yt-dlp + {browser} cookies "
                f"({len(posts)} posts)")
            return posts

    # Path 4: Apify (paid alternative — needs APIFY_TOKEN in keychain)
    apify_token = _keychain("apify-instagram")
    if apify_token:
        posts = _apify_instagram(apify_token)
        if posts:
            log(f"  [Instagram] success via Apify ({len(posts)} posts)")
            return posts
    else:
        log("  [Instagram] no apify-instagram keychain entry; skipping Apify path")

    # Path 5: instaloader anonymous (kept as last-resort free fallback)
    try:
        import instaloader
        L = instaloader.Instaloader(quiet=True, download_pictures=False,
                                    download_videos=False, download_video_thumbnails=False,
                                    save_metadata=False, compress_json=False,
                                    max_connection_attempts=1, request_timeout=15)
        try:
            L.load_session_from_file(INSTAGRAM_HANDLE)
        except FileNotFoundError:
            pass
        profile = instaloader.Profile.from_username(L.context, INSTAGRAM_HANDLE)
        posts = []
        for i, post in enumerate(profile.get_posts()):
            posts.append({"id": post.shortcode, "title": (post.caption or "")[:80]})
            if i >= 11:
                break
        if posts:
            log(f"  [Instagram] success via instaloader ({len(posts)} posts)")
            return posts
    except Exception as e:
        log(f"  instaloader path failed: {type(e).__name__}: {e}")

    # Path 6: yt-dlp anonymous (final fallback)
    try:
        result = subprocess.run(
            ["python3", "-m", "yt_dlp", "--flat-playlist",
             "--print", "%(id)s|%(title)s",
             "--no-warnings", INSTAGRAM_URL],
            capture_output=True, text=True, timeout=180,
        )
        posts = []
        for line in result.stdout.strip().split("\n"):
            if "|" in line:
                parts = line.split("|", 1)
                if len(parts) == 2 and parts[0]:
                    posts.append({"id": parts[0], "title": parts[1]})
        if posts:
            log(f"  [Instagram] success via yt-dlp anonymous ({len(posts)} posts)")
        return posts
    except Exception as e:
        log(f"  yt-dlp anonymous path failed: {e}")
        return []


def download_and_transcribe(url, video_id, title, video_dir, transcript_dir, label):
    transcript_path = transcript_dir / f"{video_id}.txt"
    if transcript_path.exists():
        log(f"  SKIP (already transcribed): {video_id}")
        return True

    video_path = video_dir / f"{video_id}.mp4"
    audio_path = video_dir / f"{video_id}.mp3"

    log(f"  Downloading {label}: {video_id} — {title[:60]}")
    r = subprocess.run(
        ["python3", "-m", "yt_dlp", "-o", str(video_path),
         "--no-warnings", "--quiet", url],
        capture_output=True, text=True, timeout=180,
    )
    if r.returncode != 0 or not video_path.exists():
        log(f"  DOWNLOAD FAILED: {r.stderr[-300:]}")
        return False

    subprocess.run(
        [FFMPEG, "-y", "-i", str(video_path),
         "-vn", "-ar", "16000", "-ac", "1", "-q:a", "2", str(audio_path)],
        capture_output=True, timeout=120,
    )
    if not audio_path.exists():
        log(f"  AUDIO EXTRACT FAILED: {video_id}")
        video_path.unlink(missing_ok=True)
        return False

    try:
        text = transcribe_with_gemini(audio_path)
        header = (
            f"## {label} {video_id}\n"
            f"## Title: {title}\n"
            f"## URL: {url}\n"
            f"## Transcribed: {datetime.now().isoformat()}\n\n"
        )
        transcript_path.write_text(header + text)
        log(f"  ✓ Transcribed {len(text)} chars → {transcript_path.name}")

        # Cross-pollinate with Grace: if she's already pulled this TikTok
        # into grace-brains, append our audio transcript section to her md.
        # Append-only, never overwrite — Grace owns the structured analysis.
        if label == "TikTok":
            grace_md = GRACE_TIKTOK_DIR / f"{video_id}.md"
            if grace_md.exists():
                existing = grace_md.read_text()
                marker = "## Audio Transcription (auto-pulled by RevFactor brain-scan)"
                if marker not in existing:
                    addendum = (
                        f"\n---\n\n{marker}\n"
                        f"*Transcribed {datetime.now().isoformat()} — Gemini 2.5 Flash. "
                        f"This is the spoken/sung audio in the video, NOT necessarily Federico narrating "
                        f"(could be soundtrack lyrics or background audio).*\n\n"
                        f"{text}\n"
                    )
                    grace_md.write_text(existing + addendum)
                    log(f"  ✓ Appended audio transcription to Grace's md: {grace_md.name}")

        video_path.unlink(missing_ok=True)
        audio_path.unlink(missing_ok=True)
        return True
    except Exception as e:
        log(f"  TRANSCRIPTION FAILED: {e}")
        video_path.unlink(missing_ok=True)
        audio_path.unlink(missing_ok=True)
        return False


def scan_tiktok(state):
    log(f"Scanning TikTok @{TIKTOK_HANDLE}...")
    videos = list_tiktok_videos()
    log(f"  Found {len(videos)} total TikToks on channel")

    seen = set(state.get("tiktok", []))
    new_videos = [v for v in videos if v["id"] not in seen]
    if not new_videos:
        log("  No new TikToks.")
        return 0

    log(f"  {len(new_videos)} new TikTok(s) to process")
    processed = 0
    for v in new_videos:
        url = f"https://www.tiktok.com/@{TIKTOK_HANDLE}/video/{v['id']}"
        if download_and_transcribe(url, v["id"], v["title"], TIKTOK_DIR, TIKTOK_TRANSCRIPTS, "TikTok"):
            state.setdefault("tiktok", []).append(v["id"])
            save_state(state)
            processed += 1
            time.sleep(2)
    log(f"  TikTok: processed {processed}/{len(new_videos)}")
    return processed


def scan_instagram(state):
    log(f"Scanning Instagram @{INSTAGRAM_HANDLE}...")
    posts = list_instagram_posts()
    if not posts:
        # Track consecutive empty fetches in state. Slack-alert weekly (not daily)
        # once broken — the fix is auth-related and Aaron doesn't need 7 daily
        # alerts saying the same thing.
        empty_count = state.get("instagram_empty_streak", 0) + 1
        state["instagram_empty_streak"] = empty_count
        save_state(state)
        log(f"  Instagram scan returned no posts (streak: {empty_count} day(s))")
        if empty_count == 3 or (empty_count >= 7 and empty_count % 7 == 0):
            slack_alert(
                f":no_entry: [revfactor brain-scan] Instagram pull has returned 0 posts "
                f"for {empty_count} consecutive runs — Fede's IG content is not landing "
                f"in the brain.\n\n"
                f"To fix, pick one of:\n"
                f"• *Apify (recommended, paid ~$15/mo)* — create an Apify account at "
                f"https://apify.com, add the token via "
                f"`security add-generic-password -a $USER -s apify-instagram -w <TOKEN>`. "
                f"Daily IG scans resume automatically the next morning.\n"
                f"• *Browser cookies (free, fragile)* — log into Instagram in Chrome on "
                f"this Mac; cookies last ~6 months before re-login needed.\n"
                f"• *Fede's IG login (free, robust)* — instaloader CLI:\n"
                f"`instaloader --login {INSTAGRAM_HANDLE}` then enter Fede's password. "
                f"Session persists until Meta invalidates it."
            )
        return 0
    # Reset the empty streak on a successful fetch
    if state.get("instagram_empty_streak"):
        state["instagram_empty_streak"] = 0
        save_state(state)
    log(f"  Found {len(posts)} total Instagram posts")

    seen = set(state.get("instagram", []))
    new_posts = [p for p in posts if p["id"] not in seen]
    if not new_posts:
        log("  No new Instagram posts.")
        return 0

    log(f"  {len(new_posts)} new IG post(s) to process")
    processed = 0
    for p in new_posts:
        url = f"https://www.instagram.com/reel/{p['id']}/"
        if download_and_transcribe(url, f"autoscan_{p['id']}", p["title"], IG_DIR, IG_TRANSCRIPTS, "Instagram"):
            state.setdefault("instagram", []).append(p["id"])
            save_state(state)
            processed += 1
            time.sleep(2)
    log(f"  Instagram: processed {processed}/{len(new_posts)}")
    return processed


def auto_commit_new_content(tt_count, ig_count):
    """If new transcripts were pulled, commit + push so they're never lost."""
    if tt_count == 0 and ig_count == 0:
        return
    try:
        # Stage the transcript dirs + state file
        subprocess.run(
            ["git", "add",
             "scripts/seen_ids.json",
             "tiktok_videos/transcripts/",
             "instagram_videos/transcripts/"],
            cwd=str(REVFACTOR_ROOT), check=False, capture_output=True,
        )
        # Check if anything was actually staged
        diff = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            cwd=str(REVFACTOR_ROOT), capture_output=True, text=True,
        )
        if not diff.stdout.strip():
            return  # nothing to commit (state file unchanged, transcripts gitignored, etc.)

        msg = f"brain-scan: auto-commit {tt_count} new TikTok(s), {ig_count} new IG post(s)"
        subprocess.run(
            ["git", "commit", "-m", msg, "-m",
             "Auto-committed by scan_and_transcribe.py to ensure transcripts survive sync churn."],
            cwd=str(REVFACTOR_ROOT), check=False, capture_output=True,
        )
        push = subprocess.run(
            ["git", "push", "--quiet"],
            cwd=str(REVFACTOR_ROOT), capture_output=True, text=True,
        )
        if push.returncode == 0:
            log(f"  ✓ Auto-committed + pushed new content")
        else:
            log(f"  ⚠ Auto-commit succeeded but push failed: {push.stderr[:200]}")
    except Exception as e:
        log(f"  ⚠ Auto-commit error (non-fatal): {e}")


def main():
    log("=" * 60)
    log("RevFactor Brain Scan starting")
    state = load_state()
    log(f"Delta mode — already seen {len(state.get('tiktok', []))} TikToks, "
        f"{len(state.get('instagram', []))} IG posts")

    tt = scan_tiktok(state)
    ig = scan_instagram(state)

    auto_commit_new_content(tt, ig)

    log(f"DONE. New TikToks: {tt}, New IG: {ig}")
    log("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
