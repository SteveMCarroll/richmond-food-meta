# Research handoff to frontend/build owner

**Research state: 2026-07-19.** The research source of truth now contains **31 venues and 6 hubs**.

## New venue records

- `data/venues/szechuan-tales.md` — `hot`, medium confidence; Sichuan; group/private-room use.
- `data/venues/silkway-halal.md` — `staple`, medium confidence; Hui/Ningxia halal; incomplete weekly hours are intentional.
- `data/venues/top-shanghai.md` — `staple`, medium confidence; Shanghai/Jiangnan; Tuesday-hours disagreement is preserved.
- `data/venues/sing-yee.md` — `staple`, medium confidence; Cantonese with post-9:00pm `da laang`; not counted as dedicated Chaoshan.

All four parse against `data/SCHEMA.md`; `id` matches filename and every source has label, URL, and date.

## Existing records changed by review disposition

- All six hubs now have dated sources or softened claims.
- Ban Bu Xian is `watch`, not `hot`.
- Loon Fong Hotpot is medium confidence, not high.
- Lanxuan now cites Chinese Restaurant Awards chef and Elite 30 evidence.
- Yaohan is `watch`, not an unsupported `fading` call.
- RedNote/Fantuan/Reddit-dependent records now carry source-access notes.

## Public research documents

- `research/METHODOLOGY.md` is canonical.
- `research/SOURCE-REGISTER.md` records the current source-access state.
- `research/INDEPENDENT-REVIEW.md` preserves the cold review.
- `research/REVIEW-DISPOSITION.md` records which findings were adopted or modified.
- `research/REVIEW-BRIEF.md` is ready for a future independent audit.

## Build action

Regenerate the compiled site data from `data/`; do not hand-edit `site/content/restaurants.json`. The research pass intentionally did not compile, alter presentation, commit, or deploy after ownership was clarified.

The UI should tolerate deliberately blank operational fields and partial weekly hours. Do not replace those blanks with inferred values.
