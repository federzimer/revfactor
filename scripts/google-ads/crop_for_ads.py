"""Crop the 5 RevFactor hero images into Google Ads aspect ratios.

Source: 2816×1536 PNGs at /Users/aaronwhittaker/Claude/RevFactor/public/heroes/
Output: /Users/aaronwhittaker/Claude/google-ads/ad_images/

Per Google Ads spec:
  • Landscape 1.91:1 — recommended 1200×628, max 5120 KB. We export ~2400×1256.
  • Square    1:1   — recommended 1200×1200, max 5120 KB. We export 1536×1536.

Composition: every hero has the cabin/structure on the right side, so the
square crop is right-biased (rightmost 1536px) to keep the architecture
in frame. Landscape uses the full width with a slight vertical trim.
"""

from PIL import Image
import os

SRC = "/Users/aaronwhittaker/Claude/RevFactor/public/heroes"
OUT = "/Users/aaronwhittaker/Claude/google-ads/ad_images"
os.makedirs(OUT, exist_ok=True)

HEROES = {
    "aframe":    "a-frame-golden-v4.png",
    "cliffside": "cliffside-forest-v5.png",
    "clifftop":  "clifftop-dusk-v3.png",
    "meadow":    "modern-meadow-v1.png",
    "snowcap":   "snowcap-peaks-v2.png",
}

LANDSCAPE_W, LANDSCAPE_H = 2400, 1256  # 1.911:1
SQUARE_SIDE = 1536                      # 1:1


def crop_landscape(img):
    """Crop to 1.91:1 by trimming top/bottom symmetrically. Source is 1.83:1
    so we need slightly TALLER than source — actually trim sides instead."""
    w, h = img.size
    # We want w/h = 1.91, source is w/h = 1.83
    # 1.91 > 1.83, so source is too tall — trim top+bottom
    target_h = int(w / 1.91)  # how tall it should be at full width
    if target_h <= h:
        crop_top = (h - target_h) // 2
        box = (0, crop_top, w, crop_top + target_h)
        out = img.crop(box)
    else:
        # source too short — trim sides instead (won't trigger here)
        target_w = int(h * 1.91)
        crop_left = (w - target_w) // 2
        out = img.crop((crop_left, 0, crop_left + target_w, h))
    return out.resize((LANDSCAPE_W, LANDSCAPE_H), Image.LANCZOS)


def crop_square_right(img):
    """Right-biased square crop — keep the cabin/architecture in frame."""
    w, h = img.size
    side = min(w, h)  # = 1536 for our sources
    # Take rightmost `side`×`side`
    box = (w - side, (h - side) // 2, w, (h - side) // 2 + side)
    out = img.crop(box)
    return out.resize((SQUARE_SIDE, SQUARE_SIDE), Image.LANCZOS)


def crop_square_center(img):
    """Center square crop — wider scene, cabin smaller."""
    w, h = img.size
    side = min(w, h)
    box = ((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2)
    out = img.crop(box)
    return out.resize((SQUARE_SIDE, SQUARE_SIDE), Image.LANCZOS)


def main():
    print(f"Source: {SRC}")
    print(f"Output: {OUT}\n")
    for tag, fname in HEROES.items():
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            print(f"  SKIP missing: {path}")
            continue
        img = Image.open(path).convert("RGB")
        # Landscape
        out_path = os.path.join(OUT, f"{tag}-landscape-1200x628.jpg")
        crop_landscape(img).save(out_path, "JPEG", quality=88, optimize=True)
        print(f"  + {out_path}  ({os.path.getsize(out_path) // 1024} KB)")
        # Square right
        out_path = os.path.join(OUT, f"{tag}-square-cabin.jpg")
        crop_square_right(img).save(out_path, "JPEG", quality=88, optimize=True)
        print(f"  + {out_path}  ({os.path.getsize(out_path) // 1024} KB)")
        # Square center
        out_path = os.path.join(OUT, f"{tag}-square-scenic.jpg")
        crop_square_center(img).save(out_path, "JPEG", quality=88, optimize=True)
        print(f"  + {out_path}  ({os.path.getsize(out_path) // 1024} KB)")


if __name__ == "__main__":
    main()
