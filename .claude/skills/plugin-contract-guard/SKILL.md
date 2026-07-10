---
name: plugin-contract-guard
description: >-
  Keeps the ads-platform plugins (google-ads-baby, meta-ads-baby, future ones)
  conformant to the shared mutation-safety contract. Use whenever adding,
  renaming, or removing a tool in a plugin, editing the mutation kernel
  (confirm/history/safe-word/mutation-log), or before committing plugin changes.
  Trigger on work touching prepare_*/confirm_* tools, the confirmation protocol,
  or the mutation-history JSONL shape across these separate repositories.
---

# Plugin Contract Guard

This is a **developer-only, personal** skill (not shipped to plugin users). It
holds you to the mutation-safety contract that all ads-platform plugins must share
without sharing code.

## Why this exists

`google-ads-baby` and `meta-ads-baby` are separate repos. There is no shared npm
package and no shared repo. The plumbing (`confirm.ts`, `history.ts`, the
`prepare → preview → safe-word → confirm` protocol) was copied between them and
**already drifted** — but most of that drift is *legitimate* (env prefixes,
account-id field, dotfile names differ per platform). Copying code would fight
that reality.

So we pin the **contract**, not the code. The contract lives at
`docs/mutation-safety-contract.md` in the `marketing-context-mcp` repo (the hub
whose enforcement gate and `trigger_tools` map bind to these exact tool names).
This skill enforces it.

## When to run

- Adding / renaming / removing any tool in a plugin.
- Editing the mutation kernel: confirm tokens, safe-word flow, history/log record.
- Before committing changes in `google-ads-baby` or `meta-ads-baby`.
- Any time you suspect the plugins' kernels have diverged.

## How to run

```bash
node <marketing-context-mcp>/.claude/skills/plugin-contract-guard/check-contract.mjs \
  [path-to-google-ads-baby] [path-to-meta-ads-baby]
```

With no arguments it assumes the three repos are siblings and resolves plugins
relative to the marketing-context-mcp repo (`../google-ads-baby`,
`../meta-ads-baby`). Pass explicit paths otherwise.

Exit code 0 = conformant. Non-zero = drift; read the report and reconcile.

## What to do with the result

1. If a **kernel tool is missing or renamed** in a plugin: that is a contract
   violation. Restore the exact name from §1 of the contract, or — if the change
   is intentional and correct — update `docs/mutation-safety-contract.md` FIRST,
   then re-run. The contract leads; the plugins follow.
2. If a **log field is missing**: add it to that plugin's history record (§3).
   Remember the account-id field is platform-named (`customerId` / `adAccountId`)
   — that is a variation point, not a violation.
3. Never "fix" a variation point (§4). Env prefixes, account-id names, and dotfile
   names are *supposed* to differ.

## Optional hard backstop

The skill only fires in a Claude session, by intent. To make drift impossible
(not just discouraged), add a 3-line `pre-commit` hook in each plugin repo that
runs the same `check-contract.mjs`. That is the one acceptable duplication — three
lines of hook, never a copy of the kernel.

## Guardrails

- This skill lives in `.claude/skills/` and is excluded from the npm `files`
  whitelist and from the plugin export (`.claude-plugin/`). It must stay
  developer-only. Do not move it under a distributed path.
- The contract doc is the single source of truth. Keep the machine-readable
  regions (`kernel-tools`, `log-fields`) intact — the check parses them.
