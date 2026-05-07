## Plan: Embedding-Based Card Tagging

Replace the current random tagging in [backend/tag_cards.py](/Volumes/BlackHole/dev/web/semioteca/backend/tag_cards.py#L1) with an offline embedding pipeline that assigns multiple curated tags only when they clear a confidence threshold. The recommended path is: clean each card down to its main-topic text, compare that text against curated tag-definition paragraphs with SentenceTransformer embeddings, keep only high-confidence top tags, and write the final tags back into [backend/cards.json](/Volumes/BlackHole/dev/web/semioteca/backend/cards.json#L1) so the existing content sync flow keeps working.

**Steps**
1. Define the tagging contract and curation inputs.
Decide the final selection policy up front: multi-label output, abstention allowed, low maximum tag count per card, deterministic scoring, and curated definition paragraphs for each existing tag in [backend/card-tags.json](/Volumes/BlackHole/dev/web/semioteca/backend/card-tags.json#L1).

2. Decide where curated tag definitions live.
Either evolve [backend/card-tags.json](/Volumes/BlackHole/dev/web/semioteca/backend/card-tags.json#L1) into structured objects or keep it as the public vocabulary and load descriptions from a second file via [backend/tags.py](/Volumes/BlackHole/dev/web/semioteca/backend/tags.py#L1). I recommend a separate definitions file to avoid unnecessary schema churn.

3. Add offline ML dependencies.
Extend [requirements.txt](/Volumes/BlackHole/dev/web/semioteca/requirements.txt#L1) with the packages needed to run `sentence-transformers` and the selected model, and document that the first run will download model weights. This blocks implementation and validation.

4. Rework the tagging script into a real pipeline.
Replace the random `tag_dataset()` flow in [backend/tag_cards.py](/Volumes/BlackHole/dev/web/semioteca/backend/tag_cards.py#L51) with functions that:
load the dataset,
build cleaned topic text per card,
load the embedding model,
embed tag definitions once,
embed cards in batches,
compute similarity scores,
apply threshold and top-k selection,
save the tagged dataset.

5. Implement main-topic text cleaning.
Add explicit preprocessing that removes leading and trailing bibliographic boilerplate, short heading-only paragraphs, repeated citation lines, and low-information metadata while preserving the first substantive paragraphs. This should be paragraph-based, not a fixed character trim, because the boilerplate pattern varies across books in [backend/cards.json](/Volumes/BlackHole/dev/web/semioteca/backend/cards.json#L1).

6. Implement confidence-aware multi-label selection.
Use a selection rule that:
assigns no tags when the top score is below threshold,
keeps the strongest tag when confidence is sufficient,
adds secondary tags only if they also clear threshold and are close enough to the top score to count as co-topics.
Keep the maximum tag count small so the output still reflects the main topic.

7. Keep production schema minimal unless debugging requires more.
Recommended default: persist only `tags` in [backend/cards.json](/Volumes/BlackHole/dev/web/semioteca/backend/cards.json#L1) and keep confidence scores in dry-run output or a separate debug report. Only extend [backend/card_models.py](/Volumes/BlackHole/dev/web/semioteca/backend/card_models.py#L1) if you explicitly want stored score metadata or abstention flags in the content artifact.

8. Integrate tagging into the content workflow.
Place tagging after card generation and before sync. The target flow is:
[backend/generate_cards_json.py](/Volumes/BlackHole/dev/web/semioteca/backend/generate_cards_json.py#L1) → tagger → [scripts/sync-content.mjs](/Volumes/BlackHole/dev/web/semioteca/scripts/sync-content.mjs#L1)
If quality is still being tuned, start as a standalone command first, then fold it into [package.json](/Volumes/BlackHole/dev/web/semioteca/package.json#L1) once stable.

9. Run a review-first rollout.
Before full tagging, run on a sample across multiple books, inspect zero-tag, one-tag, and multi-tag cases, then tune definitions and thresholds before tagging the full corpus.

10. Optionally add frontend tag display after backend quality is acceptable.
The frontend already supports `tags: string[]` in [frontend/src/lib/types/content.ts](/Volumes/BlackHole/dev/web/semioteca/frontend/src/lib/types/content.ts#L1). Rendering badges or tag-aware search in [frontend/src/routes/cards/+page.svelte](/Volumes/BlackHole/dev/web/semioteca/frontend/src/routes/cards/+page.svelte#L1) should wait until the backend output is good enough to expose.

**Relevant files**
- [backend/tag_cards.py](/Volumes/BlackHole/dev/web/semioteca/backend/tag_cards.py#L1) — main implementation surface.
- [backend/card-tags.json](/Volumes/BlackHole/dev/web/semioteca/backend/card-tags.json#L1) — current public tag vocabulary.
- [backend/tags.py](/Volumes/BlackHole/dev/web/semioteca/backend/tags.py#L1) — tag loading surface.
- [backend/cards.json](/Volumes/BlackHole/dev/web/semioteca/backend/cards.json#L1) — final tagged artifact.
- [backend/card_models.py](/Volumes/BlackHole/dev/web/semioteca/backend/card_models.py#L1) — only if metadata storage changes.
- [backend/generate_cards_json.py](/Volumes/BlackHole/dev/web/semioteca/backend/generate_cards_json.py#L1) — upstream generation step.
- [requirements.txt](/Volumes/BlackHole/dev/web/semioteca/requirements.txt#L1) — ML dependencies.
- [package.json](/Volumes/BlackHole/dev/web/semioteca/package.json#L1) — script integration point.
- [scripts/sync-content.mjs](/Volumes/BlackHole/dev/web/semioteca/scripts/sync-content.mjs#L1) — existing sync stage.
- [README.md](/Volumes/BlackHole/dev/web/semioteca/README.md#L1) — workflow documentation.
- [frontend/src/lib/types/content.ts](/Volumes/BlackHole/dev/web/semioteca/frontend/src/lib/types/content.ts#L1) — already compatible with tags.
- [frontend/src/routes/cards/+page.svelte](/Volumes/BlackHole/dev/web/semioteca/frontend/src/routes/cards/+page.svelte#L1) — optional later UI/search step.

**Verification**
1. Confirm the environment can import `sentence_transformers`, instantiate the selected model, and embed a tiny sample.
2. Manually inspect cleaned text for representative cards from different books to verify boilerplate removal preserves the topical core.
3. Run the tagger on a small sample and inspect abstained, single-tag, and multi-tag cases against your intended policy.
4. Validate that every emitted tag belongs to the curated vocabulary and that [backend/cards.json](/Volumes/BlackHole/dev/web/semioteca/backend/cards.json#L1) still deserializes cleanly through the existing model.
5. Run the existing sync flow and verify the tagged data reaches the frontend artifact without schema breakage.
6. Perform a manual review pass across multiple authors/books before the full run.

**Decisions**
- Included: offline tagging during content preparation, curated tag definitions, boilerplate-aware preprocessing, multi-label selection, abstention, deterministic scoring.
- Excluded from the first implementation: supervised training, live runtime tagging, taxonomy expansion, embedding persistence in the repo.
- Recommended default: keep only final `tags` in production content unless you explicitly want confidence metadata exposed.

I saved this plan to session memory so it stays stable for handoff. If you want, the next refinement step is to settle one implementation choice before coding:
1. Keep tag definitions in a new file.
2. Convert the existing tag file into structured objects.
3. Keep the current file and hardcode definitions temporarily in the script.
