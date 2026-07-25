# Data schema — Seattle Eastside Chinese food research

This folder is an independent publishing source of truth. It intentionally does
not share files with the Richmond BC guide.

Each record is YAML frontmatter plus a Markdown evidence body. A future frontend
may compile the files, but it should not replace the source records with hand-edited
JSON.

## Venue files

Required fields: `id`, `name`, `city`, `region`, `format`, `status`,
`confidence`, and `lastVerified`.

```yaml
---
id: example-venue
name: Example Venue
nameZh: ""
city: Bellevue
region: Hunan
format: Full-service regional restaurant
hub: bel-red-20th
area: Bel-Red
address: ""
phone: ""
website: ""
reservationUrl: ""
price: "$$"
hours:
  mon: ""
  tue: ""
  wed: ""
  thu: ""
  fri: ""
  sat: ""
  sun: ""
bestDaypart: ""
parking: ""
groupFit: ""
status: staple
confidence: medium
lastVerified: "2026-07-20"
dishes:
  - name: Example dish
    nameZh: ""
    note: Why this dish is evidence-bearing
cautions: []
sources:
  - label: What this source supports
    url: https://example.com/direct-page
    date: "2026-07-20"
order: 10
---

Evidence, disagreements, and limitations go here.
```

Optional Eastside-specific fields:

- `otherEastsideLocations`: branch notes that prevent accidental duplication.
- `operationalConflict`: a short public-facing summary when first-party and
  current directory/transaction sources disagree.
- `transit`: useful proximity to a 2 Line station or major Eastside transit hub.

## Hub files

Hubs can be a mall, plaza, food hall, or corridor/district. A district record is
not evidence that every block or venue is active at every daypart.

```yaml
---
id: example-hub
name: Example Hub
type: District
city: Bellevue
area: Example area
status: hot
summary: ""
dayparts:
  breakfast: ""
  lunch: ""
  dinner: ""
  late: ""
sources: []
order: 10
---
```

## Controlled values

- `status`: `hot`, `rising`, `staple`, `watch`, `fading`, `lead`, `new-lead`
- `confidence`: `high`, `medium`, `low`, `lead`
- `price`: `$`, `$$`, `$$$`, `$$$$`

## Rules

- The filename slug must equal `id`.
- Unknown fields stay blank or are omitted; do not infer hours, reservations,
  payment methods, or regional identity.
- Every source needs a direct URL and observation date.
- First-party pages establish operations, not quality.
- A high-confidence `hot`, `rising`, or `staple` read normally needs current
  operations plus at least two independent food/use signals.
- Branches are operationally distinct. Do not silently copy hours or status from
  one branch to another.
- King County inspection evidence stays separate from food quality.
