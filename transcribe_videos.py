#!/usr/bin/env python3
"""
Transcribe Instagram videos using Gemini 2.5 Flash (high accuracy, ~4s/video).
Saves transcripts to instagram_videos/transcripts/
"""

import json
import time
import subprocess
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = "AIzaSyAylMkmDbgG79mUcu8AtNRJC33lDvScYa0"
VIDEO_DIR = Path("/Users/aaronwhittaker/Claude/RevFactor/instagram_videos")
TRANSCRIPT_DIR = VIDEO_DIR / "transcripts"
TRANSCRIPT_DIR.mkdir(exist_ok=True)

client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.5-flash"

videos = sorted(VIDEO_DIR.glob("*.mp4"))
print(f"Found {len(videos)} videos — using {MODEL}")

results = []
errors = []

for i, video_path in enumerate(videos):
    transcript_file = TRANSCRIPT_DIR / (video_path.stem + ".txt")

    if transcript_file.exists():
        print(f"[{i+1}/{len(videos)}] SKIP: {video_path.name}")
        with open(transcript_file) as f:
            results.append({"file": video_path.name, "transcript": f.read()})
        continue

    # Extract audio
    audio_path = VIDEO_DIR / "tmp_audio.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(video_path),
        "-vn", "-acodec", "mp3", "-ar", "16000", "-ac", "1", "-q:a", "2",
        str(audio_path)
    ], capture_output=True)

    if not audio_path.exists() or audio_path.stat().st_size < 100:
        print(f"[{i+1}/{len(videos)}] ERROR: {video_path.name}")
        errors.append(video_path.name)
        continue

    with open(audio_path, "rb") as f:
        audio_data = f.read()
    audio_path.unlink()

    try:
        t0 = time.time()
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_bytes(data=audio_data, mime_type="audio/mp3"),
                "Transcribe this audio verbatim. Include all spoken words exactly as said, "
                "including filler words (um, uh, like, you know), false starts, and informal speech. "
                "If there is no speech or only music, write [NO SPEECH]. "
                "Return ONLY the transcript text."
            ]
        )
        elapsed = time.time() - t0
        transcript = response.text.strip()

        with open(transcript_file, "w") as f:
            f.write(transcript)

        results.append({"file": video_path.name, "transcript": transcript})
        print(f"[{i+1}/{len(videos)}] OK ({elapsed:.1f}s): {video_path.name} — {len(transcript)} chars")

    except Exception as e:
        print(f"[{i+1}/{len(videos)}] API ERROR: {video_path.name} — {e}")
        errors.append(video_path.name)
        time.sleep(3)

    time.sleep(0.2)

# Save combined JSON
combined_path = TRANSCRIPT_DIR / "all_transcripts.json"
with open(combined_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"\nDone. {len(results)} transcripts, {len(errors)} errors.")
if errors:
    print(f"Errors: {errors}")
