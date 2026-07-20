# Richmond BC — Chinese Food Meta

A working, evidence-based guide to the current state of Richmond, BC's Chinese
food scene — organized by **hub** and **daypart**, not one citywide popularity
list. Every entry carries a confidence level and a last-verified date.

## How it works

```
data/            # SINGLE SOURCE OF TRUTH (hand-edited: markdown + YAML frontmatter)
  SCHEMA.md      #   the contract — how to write venue/hub files
  site.md        #   site-level meta
  hubs/*.md      #   one file per hub (food court / mall / plaza / food street)
  venues/*.md    #   one file per restaurant or stall
research/        # exploratory research ledger (not read by the site)
  METHODOLOGY.md #   canonical research and editorial method
  REVIEW-BRIEF.md#   cold-review instructions for a separate agent/model
site/            # the static website (GitHub Pages-ready)
  scripts/compile.mjs   # data/** -> site/content/restaurants.json
  content/restaurants.json  # GENERATED — do not hand-edit
  index.html, meta.html, app.js, styles.css
PROJECT_PLAN.md  # project vision + editorial principles
```

Research is added by editing files under `data/`. The site is regenerated from
them — never edit `site/content/restaurants.json` by hand.

## Build & preview

```sh
cd site
npm install          # one-time: installs js-yaml
npm run build        # compile data/** -> content/restaurants.json
npm run watch        # auto-recompile on data/ changes
npm run serve        # preview at http://localhost:8137
```

See `data/SCHEMA.md` for the data contract and `research/METHODOLOGY.md` for
the canonical source hierarchy, evidence rules, status/confidence calibration,
recency policy, known biases, and update workflow.

## Independent review

For a genuinely fresh point of view, start a new task with a different model and
give it `research/REVIEW-BRIEF.md`. The reviewer should inspect the repository
directly and should not be primed with this task's conversational conclusions.
