#!/usr/bin/env python3
"""
Transcribe YouTube videos using Gemini 2.5 Pro (direct YouTube URL — highest accuracy).
Saves transcripts to youtube_transcripts/
"""

import json
import time
import httpx
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = "AIzaSyAylMkmDbgG79mUcu8AtNRJC33lDvScYa0"
OUT_DIR = Path("/Users/aaronwhittaker/Claude/RevFactor/youtube_transcripts")
OUT_DIR.mkdir(exist_ok=True)

client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.5-pro"

VIDEOS = [
    ("SjK86TStieE", "Advanced Airbnb Pricing and Marketing Strategies — 52:56"),
    ("X4BwYkIB5Oc", "From Broke Immigrant to Managing 70+ Airbnb Properties — 48:14"),
    ("EkWmnncmlSA", "75 Properties Later: Why a Delisted Airbnb Made Federico — 1:14:09"),
    ("rm-15RrQk38", "Federico Zimerman; A Journey through Hospitality — 51:17"),
    ("F8fB-UiGdQI", "MOVING TO AMERICA to Pursue Financial Freedom — 47:47"),
    ("HBEcLyCpVmk", "How to keep your Airbnbs safe, avoid guest accidents — 39:02"),
    ("emfvY_L1-Ms", "How to Build a Profitable Airbnb and Property Management Biz — 1:03:07"),
]

results = []

for i, (video_id, title) in enumerate(VIDEOS):
    url = f"https://www.youtube.com/watch?v={video_id}"
    transcript_file = OUT_DIR / f"{video_id}.txt"

    if transcript_file.exists() and transcript_file.stat().st_size > 100:
        print(f"[{i+1}/{len(VIDEOS)}] SKIP (exists): {video_id} — {title}")
        with open(transcript_file) as f:
            results.append({"video_id": video_id, "title": title, "url": url, "transcript": f.read()})
        continue

    print(f"[{i+1}/{len(VIDEOS)}] Processing: {title}")
    print(f"  URL: {url}")

    try:
        t0 = time.time()
        response = client.models.generate_content(
            model=MODEL,
            contents=types.Content(
                parts=[
                    types.Part(file_data=types.FileData(file_uri=url)),
                    types.Part(text=(
                        "Transcribe this video verbatim and completely. "
                        "Include every spoken word exactly as said, including filler words "
                        "(um, uh, like, you know), false starts, and repetitions. "
                        "If there are multiple speakers, prefix each turn with [Speaker name] "
                        "or [Host]/[Guest] if you can identify the roles. "
                        "Do NOT summarize — this must be a full verbatim transcript. "
                        "Return ONLY the transcript text."
                    ))
                ]
            )
        )
        elapsed = time.time() - t0
        transcript = response.text.strip()

        with open(transcript_file, "w") as f:
            f.write(transcript)

        results.append({"video_id": video_id, "title": title, "url": url, "transcript": transcript})
        print(f"  OK ({elapsed:.0f}s) — {len(transcript):,} chars / ~{len(transcript.split()):,} words")

    except Exception as e:
        elapsed = time.time() - t0
        print(f"  ERROR after {elapsed:.0f}s: {type(e).__name__}: {str(e)[:200]}")
        time.sleep(5)

    time.sleep(2)

# Save combined
combined_path = OUT_DIR / "all_transcripts.json"
with open(combined_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"\nDone. {len(results)}/{len(VIDEOS)} transcripts saved to {OUT_DIR}")
for r in results:
    wc = len(r['transcript'].split())
    print(f"  {r['video_id']}: {wc:,} words — {r['title'][:60]}")
