#!/usr/bin/env python3
"""Generate a brand-aligned blog photo via Gemini Imagen.

Usage:
    python3 scripts/generate_blog_photo.py "<prompt>" <category>/<slug>

Example:
    python3 scripts/generate_blog_photo.py \\
      "A modern timber-frame short-term rental cabin glowing from within at dusk, mist rising from a still mountain lake in the foreground, painterly cinematic light, no people, hospitality magazine quality" \\
      cabin/dusk-lake-cabin

Saves to:
    public/photos/blog/<category>/<slug>-2400.webp
    public/photos/blog/<category>/<slug>-1200.webp

Loads GEMINI_API_KEY from RevFactor sibling project .env files (the same
key already paid for and in use by the calculator). Falls back to env var
if neither is found.
"""

from __future__ import annotations
import os
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "public" / "photos" / "blog"

# Try sibling projects' .env files in order — the calculator key is the
# active paid Gemini key for RevFactor work.
ENV_CANDIDATES = [
    ROOT.parent / "revfactor-calculator" / ".env",
    ROOT.parent / "cynthiastayscurated-calculator" / ".env",
]


def load_api_key() -> str:
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    for path in ENV_CANDIDATES:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError(
        "GEMINI_API_KEY not found. Set env var or add to revfactor-calculator/.env"
    )


def main():
    if len(sys.argv) < 3:
        print("usage: generate_blog_photo.py \"<prompt>\" <category>/<slug>", file=sys.stderr)
        sys.exit(1)
    prompt = sys.argv[1]
    rel = sys.argv[2].strip("/")
    if "/" not in rel:
        print("slug must include category, e.g. cabin/dusk-lake-cabin", file=sys.stderr)
        sys.exit(1)

    out_dir = OUT_ROOT / rel.split("/")[0]
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = rel.split("/", 1)[1]

    api_key = load_api_key()

    # google-genai SDK (auto-uses Imagen for image generation when available)
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    print(f"→ Generating: {prompt[:80]}...")
    print(f"→ Output:     {out_dir / slug}-2400.webp / -1200.webp")

    # Brand-leaning prompt suffix — matches RevFactor aesthetic ("Precision Revenue Craft")
    full_prompt = (
        prompt
        + " · Style: cinematic, warm cedar/moss tones, painterly natural light, hospitality magazine quality, no text, no watermarks, no people unless requested, soft grain"
    )

    # Imagen 4 family — standard / fast / ultra. Standard balances quality + cost
    # for inline blog use. Ultra is reserved for hero/OG.
    resp = None
    for model in ("imagen-4.0-generate-001", "imagen-4.0-fast-generate-001", "imagen-4.0-ultra-generate-001"):
        try:
            r = client.models.generate_images(
                model=model,
                prompt=full_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                    person_generation="DONT_ALLOW",
                ),
            )
            if r.generated_images:
                print(f"  model used: {model}")
                resp = r
                break
            else:
                print(f"  ! {model}: no images returned (likely safety/policy block)")
        except Exception as e:
            print(f"  ! {model} failed: {e}")
            continue

    if resp is None or not resp.generated_images:
        print("All Imagen model attempts failed.", file=sys.stderr)
        sys.exit(2)

    # Save raw PNG
    raw = out_dir / f"{slug}-raw.png"
    resp.generated_images[0].image.save(str(raw))
    print(f"  saved raw: {raw.name}")

    # cwebp → 2400 + 1200 webp
    for w in (2400, 1200):
        out = out_dir / f"{slug}-{w}.webp"
        subprocess.run(
            ["cwebp", "-q", "82", "-resize", str(w), "0", str(raw), "-o", str(out)],
            check=True,
            capture_output=True,
        )
        print(f"  saved webp: {out.name}")

    raw.unlink()  # drop the intermediate PNG
    print(f"\nDone. Use in MDX: <img src=\"/photos/blog/{rel}-2400.webp\" />")


if __name__ == "__main__":
    main()
