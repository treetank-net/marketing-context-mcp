# BDOS provenance audit

Date: 2026-07-10. Scope: the distributed `knowledge/` library and repository
records that describe its construction. This is a technical provenance review,
not legal advice.

## Finding

The initial library was not a clean-room work. Repository history describes a
direct import and thematic distillation of ten `knowledge-*.md` files plus some
Python defaults. Before remediation, 27 knowledge files mentioned BDOS and 18 of
them shared at least one exact eight-word sequence with the examined source
corpus. The highest measured eight-word-shingle overlap was 8.0%; other notable
results were 6.7%, 5.0%, 5.0%, 4.5%, 4.1%, and 3.4%. This metric is only a triage
signal: low verbatim overlap does not disprove derivation of structure, selection,
or distinctive thresholds.

The examined BDOS copy contained contradictory licensing signals:

- root `LICENSE`: MIT, copyright 2026 Krzysztof Bycina & Karol Dziedzic;
- `pyproject.toml`: `license = {text = "Proprietary"}` and the classifier
  `License :: Other/Proprietary License`.

The root MIT text is a meaningful redistribution basis if it validly applies to
the supplied documentation, but the metadata conflict and the commercial role of
the knowledge corpus make reliance on that interpretation unnecessarily risky.
The remediation therefore keeps the MIT notice for historical attribution while
replacing the shipped articles through the independent-source protocol.

## Evidence record

The local evidence copy was observed at `/home/jm/Downloads/BDOS-AI-master`.
That machine-local path is not a build dependency and is not distributed.

| File | SHA-256 |
|---|---|
| `LICENSE` | `7291f606c87291ad4d48d8763ebfefa6c855b95d366f94b05d85e05228256d0c` |
| `pyproject.toml` | `e8d8afb13672736dc095dffde102fa7358c3d6ff3d9df38b3a1e7b67395f91f3` |

The ten source-file hashes are deliberately kept outside the shipped knowledge
articles; they can be recovered from the audit work log if counsel needs a full
chain-of-custody record.

Public corroboration: the [BDOS product site](https://bdos.ai/) describes expert
knowledge, analysis rules, thresholds, and playbooks as built-in product value.

## Legal-risk model behind the remediation

Copyright generally protects original expression rather than ideas, procedures,
or methods. For software, EU law expressly distinguishes protected expression
from underlying ideas and principles (Directive 2009/24/EC, Article 1(2)). A
separately protected database may also restrict extraction or reuse of all or a
substantial part of its contents (Directive 96/9/EC, Article 7). Those distinctions
support independent reconstruction of facts and interfaces, but not copying the
original wording or rebuilding a valuable curated corpus by systematic extraction.

Primary references:

- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009L0024
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009

## Remediation decision

- Added the project MIT licence and the historical third-party notice.
- Established `knowledge-provenance-policy.md` and an automated no-new-legacy gate.
- Assigned all legacy knowledge articles to isolated authors who were prohibited
  from reading BDOS, the previous article bodies, diffs, or history.
- Required primary public URLs and removal of unsupported proprietary thresholds.
- Release criterion: `PROVENANCE_STRICT=1 npm run audit:provenance`, the knowledge
  graph audit, build, smoke test, and package-content check must all pass.

Post-rewrite verification found zero BDOS markers in `knowledge/`. Across all 27
replaced files, an eight-token shingle comparison against the examined corpus
found three matches; each was an official Google documentation URL appearing in
both corpora, not shared editorial prose. The pre-rewrite comparison had exact
prose matches in 18 files.

The audit and third-party notice may name BDOS where needed to explain provenance;
model-facing knowledge articles may not retain it as a source after completion.
