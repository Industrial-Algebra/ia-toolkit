---
name: agent-efficiency
description: >
  Spend the LLM token budget wisely across long agentic sessions. Covers
  context-window economics (repumping cost), model routing (GLM for reasoning
  vs DeepSeek for mechanical), subagent model selection, session-scoping,
  selective file reads, and early compaction. Use when worried about token
  quota or API spend, when a session is running long, when deciding whether to
  switch models or start a fresh context, or when dispatching subagents.
  Triggers: efficiency, token budget, api cost, context window, long session,
  model routing, switch model, subagent model, quota, compact context, fresh
  context.
---

# Agent efficiency & token-budget discipline

## Why long sessions are expensive
Every turn re-sends the entire accumulated context (system prompt + skills +
every prior tool result). Cost grows roughly as `context_size × turns`. In a
single long session doing many distinct tasks, each late turn pays again for
all earlier file reads and history — so the marginal cost per turn climbs
throughout the session. A 50KB file read in turn 3 is paid for again in turns
4, 5, 6…

The context-window cap (372k on GLM-5.2 / DeepSeek-v4) is the backstop. The
goal is to stay well under it via discipline, not to fill it.

## Levers, ranked by impact

### 1. Fresh context per work unit (biggest)
Do one PR, phase, or coherent task per session — not six. Hand off state so
the next session starts small:
- `docs/plans/<date>-<topic>.md` for multi-step build plans
- ADRs (`docs/adr/`) for decisions
- `docs/handoff/` for in-flight state
- `memory_save` for durable facts/decisions

A new session reads the plan/memory and begins at ~small context instead of
inheriting 200K+ of accumulated turns.

### 2. Model routing
- **GLM-5.2** → reasoning: architecture, design, debugging, spike decisions,
  hard agentic judgment.
- **DeepSeek-v4-pro** → mechanical: scaffolding, repetitive edits, dependency
  ports, doc generation, test plumbing.

Switch mid-context when the task shifts (clean with large windows). The
expensive model should only pay for the reasoning it's good at.

### 3. Subagents always on DeepSeek
Subagents (dispatched tasks) are almost always mechanical — run them on
DeepSeek-v4-pro, never GLM. Reserve GLM for the orchestrating session's
reasoning.

### 4. Selective reads
Grep first (`rg`, `grep -n`), then read slices with `offset`/`limit`. Never
read a whole large file when a targeted slice does. Whole-file reads of 50KB+
persist in context for every subsequent turn — the most common silent budget
drain.

### 5. Compact early
Don't wait for the wall. Compact or restart a session once a work unit is done
and the next is unrelated. The cap forces compaction eventually; disciplined
compaction is cheaper because you choose what survives.

### 6. Terse routine output
Long replies, commit messages, and plan docs cost output tokens. Be complete
where it matters (decisions, handoffs) and terse everywhere else.

## Quick decision guide
- About to do unrelated work? → new context window.
- Mechanical task on the expensive model? → switch to DeepSeek.
- Dispatching a subagent? → DeepSeek.
- Reading a big file? → grep first, read a slice.
- Session over ~150k context and the task is winding down? → compact or wrap up.
