# Changelog

## 0.12.0 — 2026-08-06

- `read_knowledge` returns the article as plain markdown instead of a JSON
  envelope with escaped newlines: path header, body, and a short footer with
  `related` and `source`. Router-only frontmatter (summary, keywords,
  applies_to, task_type, priority, inject, trigger_*) is stripped — it cost
  roughly a fifth of every article and duplicated what the hook already
  injects. A title is synthesized only when the body has no H1 of its own.
- `search_knowledge` and `list_knowledge` return compact text lines
  (`path — title` plus the summary) instead of JSON arrays, with an explicit
  message when nothing matches.
- Smoke suite covers the new rendering: markdown out, no metadata leaks, no
  duplicated H1, original casing preserved in `source` URLs.

## Clean-source baseline — 2026-07-10

- Re-established the repository as a single clean-source baseline commit.
- Independently rewrote the legacy marketing knowledge articles from public
  primary sources and repository-native specifications.
- Added a strict provenance gate, a knowledge-graph audit, project licensing,
  third-party notices, and a documented independent-source rewrite policy.
- Preserved product functionality: layered knowledge, client context, durable
  tasks, auto-injection, required-reading enforcement, embeddings, configuration,
  and update tooling.

Older release notes were removed with the superseded Git history. The current
package version remains the compatibility identifier for existing installations;
this file no longer claims a reconstructable release-by-release history.
