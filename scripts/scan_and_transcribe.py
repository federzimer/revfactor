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


def load_gemini_key() -> str:
    """Read Gemini API key from macOS Keychain (preferred) or env var (fallback)."""
    try:
        result = subprocess.run(
            ["security", "find-generic-password",
             "-a", os.environ.get("USER", ""),
             "-s", "gemini-revfactor", "-w"],
            capture_output=True, text=True, check=True,
        )
        key = result.stdout.strip()
        if key:
            return key
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
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


def list_instagram_posts():
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
        return posts
    except Exception as e:
        log(f"Instagram list error: {e}")
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
        log("  Instagram scan returned no posts (likely rate-limited or logged-out block)")
        return 0
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
