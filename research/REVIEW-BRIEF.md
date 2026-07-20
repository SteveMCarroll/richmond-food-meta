# Independent review brief — Richmond BC Chinese dining guide

Use this brief in a **new task with a different model or agent loop**. The review should be cold: inspect the repository files directly and do not rely on summaries from the research agent that produced them.

## Objective

Audit both the research methodology and the current 31-venue dataset. Look for unsupported certainty, circular sourcing, cultural or platform bias, inconsistent status/confidence decisions, stale operations, regional misclassification, and important coverage gaps.

This is a review assignment, not a request to redesign the frontend or silently rewrite the dataset.

## Read first

1. `research/METHODOLOGY.md` — canonical method.
2. `data/SCHEMA.md` — data contract.
3. `research/SOURCE-REGISTER.md` — dated source-access state and limitations.
4. `research/REVIEW-DISPOSITION.md` — prior findings and editorial decisions.
5. `PROJECT_PLAN.md` — current scope and boundaries.
6. Every file in `data/venues/`.
7. Every file in `data/hubs/`.
8. `research/dim-sum-meta.md` and `research/empire-calibration.md` as historical working notes, not governing policy.

Do not use `site/content/restaurants.json` as the source of truth; it is compiled output.

## Required review lenses

### Methodology

- Is the source hierarchy appropriate for Richmond's Chinese dining ecosystem?
- Does it sufficiently address RedNote sponsorship/selection bias, Fantuan delivery and promotion bias, Google comparability, award bias, and unequal archival access?
- Does it use publicly auditable Chinese sources where they are genuinely current, while treating OpenRice Canada and Ming Pao Canada as archives rather than live 2026 communities?
- Does it distinguish Fantuan's public web-visible subset from the fuller app corpus, and is Westca used as historical/local evidence rather than a current census?
- Does any safety or hygiene claim resolve to Vancouver Coastal Health, the authority for Richmond, rather than Fraser Health or forum hearsay?
- Are “independence,” “current,” and “repeat behaviour” operationalized clearly enough for another researcher to reproduce?
- Does the admission rule favour easy-to-document full-service venues over stalls or older low-web-presence businesses?
- Are the cultural-calibration rules rigorous without treating Chinese-language users as monolithic?

### Dataset

- Trace each `hot`, `rising`, `staple`, and high-confidence designation to the cited evidence.
- Flag sources that cannot support the claims attributed to them.
- Identify circular or non-independent sources, including articles that merely repeat a RedNote post.
- Check whether negative service, environment, price, hygiene, and queue evidence is separated fairly from food evidence.
- Check regional labels against restaurant self-description and menu evidence; flag identity inference or overly broad hybrids.
- Inspect dish claims for specificity and recency.
- Check whether hours, addresses, phone numbers, websites, reservations, coordinates, and moves are current and internally consistent.
- Identify places that should be demoted to `watch`/`lead`, promoted, removed, or split into a more specific use-case.

### Coverage

- Identify blind spots by Chinese region, migration cohort, generation, price, format, hub, and daypart.
- Ask whether the guide overweights newer mainland-oriented platforms or older Cantonese institutions.
- Test whether siu-mei coverage is truly dish-specific and whether dim-sum coverage has enough technique evidence.
- Distinguish a curated omission from an accidental research gap.

## Verification expectations

You may browse current sources when a claim seems unstable or questionable. Prefer primary operational pages and primary/detail-rich Chinese or transactional sources. Cite direct URLs for any correction.

Do not judge authenticity from décor, English fluency, reviewer names, perceived ethnicity, or a raw star average. Do not assume a Chinese-language source is unbiased merely because it is Chinese-language.

## Deliverable

Create `research/INDEPENDENT-REVIEW.md` with:

1. **Executive verdict:** whether the method and output are publishable, publishable with corrections, or not yet publishable.
2. **Findings by severity:** critical factual errors, high-value methodological risks, medium-priority gaps, and optional improvements.
3. **Record-level findings:** cite exact venue or hub filenames and the claim/field at issue.
4. **Coverage matrix:** what the dataset covers well and what remains thin.
5. **Recommended changes:** concrete edits, separated into must-fix and later research.
6. **What the original research got right:** to avoid a review that only rewards contrarianism.

Do not edit venue files during the first review pass. Produce the report so the project owner can decide which findings to adopt.

## Ready-to-paste task prompt

> Perform a cold independent review of this Richmond BC Chinese dining guide. Read `research/REVIEW-BRIEF.md` and follow it exactly. Audit the methodology and every current venue/hub record, browse to verify questionable or time-sensitive claims, and write only `research/INDEPENDENT-REVIEW.md`. Do not edit the dataset or frontend in this pass. Be specific, evidence-led, and willing to challenge both legacy reputation and new-platform hype.
