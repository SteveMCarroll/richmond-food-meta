# Data schema — Richmond BC food meta (content collection)

This `data/` folder is the **single source of truth**. The website is generated
from it — never hand-edit `site/content/restaurants.json` (it is compiled output).

```
data/
  site.md            # site-level meta (title, subtitle, intro, updated)
  hubs/<id>.md       # one file per hub (food court / mall / plaza / food street / district)
  venues/<id>.md     # one file per restaurant OR stall
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
