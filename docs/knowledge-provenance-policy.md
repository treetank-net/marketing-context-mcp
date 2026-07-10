# Knowledge provenance policy

This policy applies to every article shipped under `knowledge/`.

## Admissible sources

1. **Primary public sources** — official product documentation, standards,
   legislation, public datasets, and first-party release notes. Use direct URLs.
2. **Original project material** — workflows and product behaviour designed in
   this repository. Point `source` to the relevant repository document or code.
3. **Licensed third-party material** — only when the exact work, version, licence,
   attribution, and compatibility with redistribution are recorded in
   `THIRD_PARTY_NOTICES.md`.
4. **Practitioner evidence** — allowed only as a named, dated opinion or dataset;
   never present it as a platform requirement or universal threshold.

Every article must have a `source` array in flat frontmatter. A source describes
where each material claim can be checked; it is not a decorative bibliography.

## Independent-source rewrite protocol

Use this protocol when the provenance or licence of an existing article is
uncertain:

1. Record the affected filename in an audit without copying its prose.
2. Give the new author only the topic, required interface/frontmatter, and
   acceptable public-source classes. The author must not inspect the questioned
   source, the old article body, diffs, or repository history.
3. Reconstruct the article from primary sources. Facts, API names, and unavoidable
   terminology may remain; selection, structure, explanations, examples, and
   recommendations must be newly authored.
4. Remove rules and numeric thresholds that cannot be independently supported.
   Label project-chosen defaults as defaults, not as vendor requirements.
5. A reviewer checks URLs, frontmatter, graph links, and textual similarity. The
   author and reviewer record the files and sources they used.
6. Only after the old body has been fully replaced may the legacy item be removed
   from the provenance baseline.

This is an engineering control, not a legal conclusion. Do not call a rewrite a
formal legal "clean room" unless counsel has approved the separation procedure.

## Prohibited shortcuts

- paraphrasing a questioned text line by line;
- using an LLM with the questioned text in its context to produce the rewrite;
- citing a search result, homepage, or another summary where a primary page exists;
- copying tables, taxonomies, examples, or a distinctive sequence of rules merely
  because individual facts are not copyrightable;
- treating access to a work as permission to redistribute it.

## Automated gate

Run `npm run audit:provenance`. It fails when a new knowledge file mentions BDOS
or another quarantined legacy marker. `PROVENANCE_STRICT=1` also fails while any
baseline legacy file remains, and is the release target after the rewrite pass.
