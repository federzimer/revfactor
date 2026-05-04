# Blog Photo Library

License-clean photos for RevFactor blog posts. Curated from Unsplash (free for commercial use, no attribution required) and AI-generated via Gemini Imagen for brand-specific shots.

**Layout convention:** every photo is exported at `2400` (full-bleed hero) and `1200` (responsive). Use the larger for `<figure class="rf-figure">` / `<section class="rf-bleed">`, the smaller for inline `<img>` use.

```html
<!-- Full-bleed hero / image-quote break -->
<section class="rf-bleed">
  <img src="/photos/blog/cabin/smokies-dawn-2400.webp" alt="A wooden cabin at dawn in the Smokies" />
  <div class="rf-bleed-inner">
    <blockquote>
      <p>"A vacant Friday night is an empty seat at takeoff."</p>
      <cite>— Federico Zimerman</cite>
    </blockquote>
  </div>
</section>

<!-- Inline figure (within prose) -->
<figure class="rf-figure">
  <img src="/photos/blog/cabin/forest-cabin-evening-1200.webp" alt="..." />
  <figcaption>Caption goes here.</figcaption>
</figure>
```

---

## Catalogue (28 photos)

### Cabin / Mountain (6)
| slug | description |
|---|---|
| `cabin/smokies-dawn` | Wooden cabin at the foot of the Smoky Mountains, dawn light |
| `cabin/forest-cabin-evening` | Modern STR cabin lit from within at forest dusk |
| `cabin/alpine-cabin-snow` | Alpine cabin with snow-dusted roof and pine surround |
| `cabin/black-aframe-fall` | Black A-frame in autumn forest |
| `cabin/cliffside-glass-home` | Glass-walled clifftop home overlooking misted mountains |
| `cabin/stone-fireplace-living` | Stone-fireplace living room interior |

### Coastal / Beach (3)
| slug | description |
|---|---|
| `coastal/beach-house-sunset` | Beach house porch facing pink sunset over open water |
| `coastal/coastal-villa-pool` | Coastal villa with infinity pool overlooking the sea |
| `coastal/nordic-coast-cabin` | Black cabin perched above a Nordic coastline |

### Lake / Forest (3)
| slug | description |
|---|---|
| `lake/reflective-lake-cabin` | Cabin reflected in a still mountain lake at first light |
| `lake/dock-evening` | Wooden dock at a quiet lake at golden hour |
| `lake/forest-trail-mist` | Mist-filled forest trail leading toward a cabin |

### Modern / Architectural (4)
| slug | description |
|---|---|
| `modern/concrete-glass-villa` | Concrete-and-glass modernist villa at twilight |
| `modern/interior-mid-century` | Mid-century modern STR living room with warm lighting |
| `modern/kitchen-light-wood` | Bright modern STR kitchen, light wood + matte black hardware |
| `modern/bedroom-linen-natural` | Linen-bed STR bedroom in soft natural light |

### Operations / Pricing (4)
| slug | description |
|---|---|
| `operations/laptop-calendar` | Laptop showing a property calendar on a wood desk |
| `operations/pricing-dashboard` | Laptop displaying a pricing dashboard with charts |
| `operations/notebook-coffee` | Notebook and coffee on a wood desk near a window |
| `operations/abstract-data-bg` | Soft abstract photograph evoking data and movement |

### Guest Experience (4)
| slug | description |
|---|---|
| `guest/welcome-table-set` | Welcoming dining table set inside a vacation rental |
| `guest/bath-tub-stone` | Freestanding stone bathtub in a luxury vacation rental |
| `guest/hot-tub-deck-night` | Wooden deck hot tub overlooking a forest at night |
| `guest/fireplace-cabin-cozy` | Cozy lit fireplace in a cabin living room |

### Seasonal (4)
| slug | description |
|---|---|
| `season/autumn-cabin-leaves` | Autumn cabin scene with red maple leaves |
| `season/winter-cabin-snow-fall` | Snowy cabin scene during a quiet snowfall |
| `season/spring-meadow-house` | Spring meadow with a small modern house in the distance |
| `season/summer-pool-deck` | Summer pool-deck scene at a beachfront STR |

---

## How to add more

**From Unsplash (free, license-clean):**
1. Find the photo on unsplash.com — copy the photo ID from the URL (`https://unsplash.com/photos/<id>`).
2. Add an entry to `scripts/build_blog_photo_library.sh` in the format `<category>|<slug>|<photo_id>|<alt>`.
3. Run `bash scripts/build_blog_photo_library.sh` — only new entries download (idempotent).

**AI-generated (brand-specific shots Unsplash can't cover):**
1. Run `python scripts/generate_blog_photo.py "<descriptive prompt>" <slug>`.
2. Output saves to `public/photos/blog/generated/<slug>.png` plus a 2400 / 1200 webp pair.
3. Use Gemini's Imagen 4 model (paid Gemini key from macOS Keychain `gemini-revfactor`).
4. Best for: branded interiors, specific city/landmark shots, infographic-style overlays.

## Recurring rule of thumb (per blog post)

- **Hero**: 1 image (full-bleed, 2400px)
- **Body breaks**: 1 image every ~1,000 words of body copy
- **Author bio**: 1 headshot (already in `/blog/<slug>/federico-author.jpg`)
- **No repeats across posts** — pick fresh from this library each time. Prefer the seasonal/category that fits the post topic.
