#!/usr/bin/env bash
# Generate an STR-themed image via Gemini 2.5 Flash Image (nano-banana).
# Usage: ./gen_str_image.sh "<prompt>" <output-slug>
#   Output: public/photos/blog/generated/<slug>.png
#           plus webp variants at 1200 and 2400 widths.

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 \"<prompt>\" <slug>"; exit 1
fi

PROMPT="$1"
SLUG="$2"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/photos/blog/generated"
mkdir -p "$OUT_DIR"

KEY="${GEMINI_API_KEY:-AIzaSyAZ2MhkGYdl5KKJgkUx3xf0LAetsYwQvEo}"

PAYLOAD_FILE="$(mktemp /tmp/gen-payload-XXXX.json)"
RESP_FILE="$(mktemp /tmp/gen-resp-XXXX.json)"
trap 'rm -f "$PAYLOAD_FILE" "$RESP_FILE"' EXIT

python3 -c "
import json, sys
print(json.dumps({
  'contents': [{'parts': [{'text': sys.argv[1]}]}],
  'generationConfig': {'responseModalities': ['IMAGE']}
}))
" "$PROMPT" > "$PAYLOAD_FILE"

echo "Generating $SLUG ..."
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD_FILE" > "$RESP_FILE"

PNG_PATH="$OUT_DIR/$SLUG.png"
PYBIN="${PYTHON:-python3}"
"$PYBIN" - "$RESP_FILE" "$PNG_PATH" <<'PY'
import sys, json, base64, os
resp_path, png_path = sys.argv[1], sys.argv[2]
with open(resp_path) as f: d = json.load(f)
if 'error' in d:
    print('  ERROR:', d['error']); sys.exit(1)
parts = d['candidates'][0]['content']['parts']
saved = False
for p in parts:
    if 'inlineData' in p:
        raw = base64.b64decode(p['inlineData']['data'])
        with open(png_path, 'wb') as f: f.write(raw)
        print(f'  wrote {png_path} ({len(raw)} bytes)')
        saved = True
        break
if not saved:
    print('  no image. Text was:', [p.get('text','')[:200] for p in parts])
    sys.exit(1)
PY

if command -v cwebp &> /dev/null; then
  cwebp -q 85 -resize 2400 0 "$PNG_PATH" -o "$OUT_DIR/${SLUG}-2400.webp" 2>/dev/null
  cwebp -q 85 -resize 1200 0 "$PNG_PATH" -o "$OUT_DIR/${SLUG}-1200.webp" 2>/dev/null
  echo "  + ${SLUG}-2400.webp, ${SLUG}-1200.webp"
fi
