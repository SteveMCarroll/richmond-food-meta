# Data schema — Richmond BC food meta (content collection)

This `data/` folder is the **single source of truth**. The website is generated
from it — never hand-edit `site/content/restaurants.json` (it is compiled output).

```
data/
  site.md            # site-level meta (title, subtitle, intro, updated)
  hubs/<id>.md       # one file per hub (food court / mall / plaza / food street / district)
  venues/<id>.md     # one file per restaurant OR stall
  ccd/catalog.yml    # 99-dish Chinese Cooking Demystified crosswalk
```

Each file is **YAML frontmatter** (structured fields, between `---` fences) plus a
**markdown body** (free-form evidence: Chinese-source notes, disagreements between
sources, dish detail). The compiler reads frontmatter into the site JSON and keeps
the body as `notes`.

Run `node scripts/compile.mjs` (from `site/`) to regenerate the site after edits.

---

## Venue frontmatter (`data/venues/<id>.md`)

Required: `id`, `name`, `region`, `format`, `status`, `confidence`, `lastVerified`.
Everything else is optional but strongly encouraged — the site renders whatever is
present, so richer data = a richer card.

```yaml
---
id: empire-seafood                # unique slug; must equal the filename
name: Empire Seafood Restaurant
nameZh: 帝苑皇宴海鮮酒家            # traditional/simplified Chinese; "" if unknown
region: Cantonese / Hong Kong     # be specific: Cantonese, Chaoshan, Hakka, Taiwanese,
                                  #   Shanghai/Jiangnan, Shaanxi/Xi'an, Sichuan/Chongqing,
                                  #   Hunan, Yunnan, Dongbei, Xinjiang/Uyghur, Hot pot, etc.
format: Dim sum · full-service    # dim sum, food-court stall, HK café, full-service,
                                  #   hot pot, bakery, dessert, noodle bar…
hub: null                         # a hub id (e.g. "empire") if this is a stall/tenant
                                  #   inside that hub; null for a standalone room
area: Golden Village              # neighbourhood/district when there is no hub

# --- rich metadata (fill as verified) ---
address: ""                       # full street address
phone: ""                         # "+1 604 ..."
website: ""
reservationUrl: ""
coordinates: { lat: null, lng: null }
price: "$$"                       # $ / $$ / $$$ / $$$$
hours:                            # per-day, 24h ranges; omit/blank days that vary
  mon: ""
  tue: ""
  wed: ""
  thu: ""
  fri: ""
  sat: ""
  sun: ""
kitchenCutoff: ""                 # last-order time if it differs from closing
bestDaypart: "Dim sum daily 9:00am–3:00pm"   # human summary shown on the card
parking: ""
payment: ""                       # e.g. "Cash + card", "Cash only"
groupFit: ""                      # notes on group size / family suitability

# --- meta signals ---
status: staple                    # hot | rising | staple | watch | fading | lead | new-lead
confidence: medium                # high | medium | low | lead
lastVerified: 2026-07-19          # ISO date of last verification

dishes:
  - name: Har gow
    nameZh: 蝦餃
    note: benchmark for wrapper technique
cautions:
  - "First seating can be noisy"
sources:
  - label: Official hours
    url: https://empirerestaurant.ca/contacts/
    date: 2026-07-19

order: 10                         # sort position in the Eat list (lower = earlier)
---

Free-form evidence goes here. Cite Chinese-language sources, note where sources
disagree, describe dish-level detail, and record anything that didn't fit a field.
```

## Hub frontmatter (`data/hubs/<id>.md`)

```yaml
---
id: empire                        # unique slug; must equal the filename
name: Empire Centre
nameZh: ""
type: Food court                  # Food court | Mall | Plaza | Food street | District
area: Golden Village
address: ""
status: hot                       # same status vocabulary as venues
dayparts:                         # only include dayparts that say something useful
  breakfast: "HK breakfast lines by 9:30–10:30"
  lunch: "Peak and busiest"
  dinner: "Winding down; stalls close 6–7pm"
  late: "Only Loon Fong Hotpot + a few full-service tenants"
sources:
  - label: Tourism Richmond Empire guide
    url: https://www.visitrichmondbc.com/blogs/food-drink/strip-malls-empire-centre/
    date: 2026-07-19
order: 10
---

Evidence for the hub: popular-times observations, tenant churn, redevelopment, etc.
```

## Rules

- `id` **must** equal the filename (without `.md`) and be a lowercase slug.
- A venue is a **stall** when `hub` names an existing hub id; otherwise it's a
  **standalone** venue (use `area`). Hubs and venues are separate entities.
- Prefer `""`/`null`/omission over guessing. Every strong claim needs a source.
- Keep `bestDaypart` human-readable; keep `hours` machine-structured.
- After edits, the site owner runs the compiler; do not edit compiled JSON.

## CCD dish crosswalk (`data/ccd/catalog.yml`)

This collection keeps the canonical 99-dish Chinese Cooking Demystified catalog
separate from venue records. It joins to established venues by `venueIds`; it
does not copy addresses, hours, status, or other venue facts.

Top-level keys:

- `meta`: title, updated date, expected dish count, introduction, and the five
  match definitions.
- `tomorrow`: a small, explicitly curated set of visit-ready recommendations.
  An item uses either `venueId` for a core venue or `leadName` for an
  unpromoted dish-specific lead.
- `dishes`: exactly 99 dish records in canonical catalog order.

Each dish record uses:

```yaml
- id: chengdu-sweet-water-noodles  # stable unique slug
  region: Sichuan & Chongqing      # canonical catalog region
  name: Chengdu Sweet Water Noodles
  nameZh: 甜水面
  province: Sichuan (Chengdu)
  dishType: Noodles
  ccdSourceUrl: https://...
  ccdSourceLabel: Substack · 2023-10-15
  match: exact                      # exact | close | regional | gap | component
  matchLabel: Exact                 # original research wording
  venueIds: [szechuan-tales]        # only IDs present in data/venues/
  leadNames: [Ajea Noodle]          # unpromoted dish lead; no venue-detail link
  recommendedMenuItem: ...
  matchExplanation: ...
  confidence: high                  # high | medium | low | not-applicable
  confidenceNote: High              # original nuanced confidence wording
  caution: ...
  sourceUrls: [https://...]         # local dish/menu evidence when available
  lastVerified: 2026-07-30
```

Rules:

- Preserve all five match classes. `exact`, `close`, `regional`, `gap`, and
  `component` are not interchangeable.
- `gap` and `component` records must not contain `venueIds` or `leadNames`.
  Their explanatory text may mention rejected or contextual leads, but the UI
  must never present those rows as restaurant recommendations.
- `venueIds` must resolve to existing venue records. Use `leadNames` instead
  when a dish-specific lead has not passed the core venue admission rule.
- Keep `confidenceNote` when the research distinguishes menu confidence,
  regional fit, destination value, or operating confidence.
- `ccdSourceUrl` points to the specific CCD recipe when available. Classic
  YouTube-era dishes may link to the CCD channel when the exact video has not
  been verified.
- `site/content/ccd-dishes.json` is generated output. Never hand-edit it.
