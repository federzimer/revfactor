#!/usr/bin/env bash
# Build a curated, license-clean photo library for RevFactor blog posts.
#
# Each entry is a tuple of (slug, unsplash_photo_id, alt). Slugs are lowercase-
# kebab and describe the imagery so they're easy to grep/select from MDX.
# Photos download into public/photos/blog/<category>/<slug>.webp at 2400px
# wide (1920w + 1200w generated at responsive break points).
#
# Unsplash license: free for commercial + editorial use, no attribution
# required (but we credit in the LIBRARY.md anyway). Source page format:
# https://unsplash.com/photos/<photo_id>
#
# Run: bash scripts/build_blog_photo_library.sh
# Idempotent — skips files that already exist.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/photos/blog"

# ---------------------------------------------------------------------------
# Curated catalogue. Format: <category>|<slug>|<unsplash_id>|<alt>
# ---------------------------------------------------------------------------
PHOTOS=(
  # CABIN / MOUNTAIN — primary STR aesthetic
  "cabin|smokies-dawn|1502784444187-359ac186c5bb|A wooden cabin nestled at the foot of the Smoky Mountains at dawn"
  "cabin|forest-cabin-evening|1449844908441-8829872d2607|A modern STR cabin lit from within at forest dusk"
  "cabin|alpine-cabin-snow|1449824913935-59a10b8d2000|An alpine cabin with snow-dusted roof and pine surround"
  "cabin|black-aframe-fall|1482192596544-9eb780fc7f66|A black A-frame cabin in autumn forest"
  "cabin|cliffside-glass-home|1542718610-a1d656d1884c|A glass-walled clifftop home overlooking misted mountains"
  "cabin|stone-fireplace-living|1505693416388-ac5ce068fe85|A stone-fireplace living room interior in a luxury STR"

  # COASTAL / BEACH
  "coastal|beach-house-sunset|1499793983690-e29da59ef1c2|A beach house porch facing a pink sunset over open water"
  "coastal|coastal-villa-pool|1564013799919-ab600027ffc6|A coastal villa with infinity pool overlooking the sea"
  "coastal|nordic-coast-cabin|1505691938895-1758d7feb511|A black cabin perched above a Nordic coastline"

  # LAKE / FOREST
  "lake|reflective-lake-cabin|1470770841072-f978cf4d019e|A cabin reflected in a still mountain lake at first light"
  "lake|dock-evening|1502082553048-f009c37129b9|A wooden dock at a quiet lake at golden hour"
  "lake|forest-trail-mist|1448375240586-882707db888b|A mist-filled forest trail leading toward a cabin"

  # MODERN / ARCHITECTURAL
  "modern|concrete-glass-villa|1600585154340-be6161a56a0c|A concrete-and-glass modernist villa at twilight"
  "modern|interior-mid-century|1600585152220-90363fe7e115|A mid-century modern STR living room with warm lighting"
  "modern|kitchen-light-wood|1600596542815-ffad4c1539a9|A bright modern STR kitchen with light wood and matte black hardware"
  "modern|bedroom-linen-natural|1540518614846-7eded433c457|A linen-bed STR bedroom in soft natural light"

  # WORK / OPERATIONS — for revenue management / pricing posts
  "operations|laptop-calendar|1517245386807-bb43f82c33c4|A laptop showing a property calendar on a wood desk"
  "operations|pricing-dashboard|1551288049-bebda4e38f71|A laptop displaying a pricing dashboard with charts"
  "operations|notebook-coffee|1499951360447-b19be8fe80f5|A notebook and coffee on a wood desk near a window"
  "operations|abstract-data-bg|1518186285589-2f7649de83e0|A soft abstract photograph evoking data and movement"

  # HOSPITALITY / GUEST EXPERIENCE
  "guest|welcome-table-set|1551776235-dde6d482980b|A welcoming dining table set inside a vacation rental"
  "guest|bath-tub-stone|1582719478250-c89cae4dc85b|A freestanding stone bathtub in a luxury vacation rental"
  "guest|hot-tub-deck-night|1540541338287-41700207dee6|A wooden deck hot tub overlooking a forest at night"
  "guest|fireplace-cabin-cozy|1483728642387-6c3bdd6c93e5|A cozy lit fireplace in a cabin living room"

  # SEASONAL — peak / shoulder pricing posts
  "season|autumn-cabin-leaves|1507371341162-763b5e419408|An autumn cabin scene with red maple leaves"
  "season|winter-cabin-snow-fall|1483728642387-6c3bdd6c93e5|A snowy cabin scene during a quiet snowfall"
  "season|spring-meadow-house|1500382017468-9049fed747ef|A spring meadow with a small modern house in the distance"
  "season|summer-pool-deck|1499793983690-e29da59ef1c2|A summer pool-deck scene at a beachfront STR"
)

mkdir -p "$OUT"

ok=0
skip=0
fail=0

echo "→ Downloading Unsplash photos to $OUT"
echo

for entry in "${PHOTOS[@]}"; do
  IFS='|' read -r category slug photo_id alt <<< "$entry"
  dir="$OUT/$category"
  mkdir -p "$dir"
  out_2400="$dir/$slug-2400.webp"
  out_1200="$dir/$slug-1200.webp"

  if [[ -f "$out_2400" && -f "$out_1200" ]]; then
    skip=$((skip+1))
    continue
  fi

  url_2400="https://images.unsplash.com/photo-${photo_id}?w=2400&q=80&fm=webp&auto=format&fit=crop"
  url_1200="https://images.unsplash.com/photo-${photo_id}?w=1200&q=80&fm=webp&auto=format&fit=crop"

  printf "  %-12s %-30s … " "$category" "$slug"

  if curl -sf -o "$out_2400" "$url_2400" && curl -sf -o "$out_1200" "$url_1200"; then
    printf "ok\n"
    ok=$((ok+1))
  else
    printf "FAIL\n"
    fail=$((fail+1))
    rm -f "$out_2400" "$out_1200"
  fi
done

echo
echo "Summary: $ok new · $skip skipped · $fail failed"
echo "Library: $OUT"
echo
echo "Next: open public/photos/blog/LIBRARY.md for the picker reference."
