# Handoff for the website agent

This research is complete as an independent knowledgebase. No website files were
created or changed for it.

## Hard boundary

- Eastside source root: `eastside/data/`
- Richmond source root: `data/`
- Never glob both roots into one build.
- Do not copy Eastside records into `site/content/restaurants.json`; that file is
  part of the Richmond implementation.
- Generate Eastside artifacts into a separately named output directory or app.

## Recommended import contract

1. Read `eastside/data/site.md` for page metadata.
2. Read only `eastside/data/hubs/*.md` and `eastside/data/venues/*.md`.
3. Validate records against `eastside/data/SCHEMA.md`.
4. Preserve `status`, `confidence`, `cautions`, and `operationalConflict` in the UI.
5. Use `id` as the stable key and never merge branches by brand name.
6. Exclude `watch` and `new-lead` by default from an unqualified “best” view, or
   label them visibly.

## Editorial behavior

Build views around hub, regional lane, dish, daypart, group fit, and confidence.
The research rejects one flat popularity ranking. Unknown values should stay
unknown; the frontend must not manufacture hours, price, or dietary claims.
