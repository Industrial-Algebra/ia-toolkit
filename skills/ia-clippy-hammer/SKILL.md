---
name: ia-clippy-hammer
description: Systematic clippy warning elimination for Industrial Algebra Rust crates. Runs clippy across all feature combinations, categorizes warnings, fixes them incrementally with verification at each step, and ensures `cargo clippy --all-features -- -D warnings` passes with zero warnings. Use when cleaning up an IA crate before review or release, or when clippy CI is failing.
---

# IA Clippy Hammer

## Overview

Drive an IA Rust crate to zero clippy warnings across **all feature combinations**.
This is non-negotiable in IA CI — every PR must pass `cargo clippy --all-features -- -D warnings`.
The hammer fixes warnings systematically, not with blanket allows.

## When to Use

- Clippy CI step is failing
- Preparing a crate for PR review
- User says "fix clippy" or "zero warnings"
- After adding a new feature gate that introduced warnings in an untested combo

## Core Principle

**Never `#[allow]` without a comment.** Every suppression must explain WHY.
The goal is zero warnings — not zero lint checks.

```rust
// ✅ Correct: allow with explanation
#[allow(clippy::too_many_arguments)]
// Schubert conditions require k, n, config, engine, policy, and audit params —
// collapsing them would obscure the mathematical structure
pub fn new(k: usize, n: usize, config: Config, engine: Engine, policy: Policy, audit: AuditSink) -> Result<Self> {

// ❌ Wrong: blanket allow with no justification
#[allow(clippy::too_many_arguments)]
pub fn new(k: usize, n: usize, config: Config, engine: Engine, policy: Policy, audit: AuditSink) -> Result<Self> {
```

## Workflow

### Phase 1: Survey — Collect All Warnings

Run clippy on every feature combination to understand the full picture:

```bash
# Default features
cargo clippy -- -D warnings 2>&1 | tee /tmp/clippy-default.txt

# All features
cargo clippy --all-features -- -D warnings 2>&1 | tee /tmp/clippy-all.txt

# Each feature individually (catches feature-specific warnings)
for feat in $(cargo metadata --format-version=1 --no-deps | jq -r '.packages[0].features | keys[]' | grep -v '^default$'); do
    echo "=== feature: $feat ==="
    cargo clippy --no-default-features --features "$feat" -- -D warnings 2>&1
done | tee /tmp/clippy-by-feature.txt
```

**If a workspace**, run for each sub-crate that has warnings:
```bash
cargo clippy -p crate-name --all-features -- -D warnings
```

### Phase 2: Categorize — Sort by Action

Group warnings into three buckets:

| Category | Examples | Action |
|---|---|---|
| **Auto-fix** | `clippy::redundant_clone`, `clippy::needless_borrow`, `clippy::single_char_pattern` | `cargo clippy --fix --allow-dirty` |
| **Manual fix** | `clippy::too_many_arguments`, `clippy::large_enum_variant`, `clippy::module_inception` | Restructure code |
| **Suppress** | `clippy::too_many_lines` on a genuinely complex function, `clippy::type_complexity` on a type that IS complex by nature | `#[allow]` with comment |

**Rule of thumb:** If a warning points at a real design issue, fix it. If it's a false positive on mathematically-necessary complexity, suppress with a comment.

### Phase 3: Auto-Fix

Apply mechanical fixes first — they're zero-risk and reduce noise:

```bash
# Allow dirty repo (you have uncommitted changes)
cargo clippy --fix --allow-dirty --allow-staged

# For workspace crates
cargo clippy --fix --allow-dirty -p crate-name
```

**After auto-fix, re-run the survey.** Auto-fixes may change line numbers or reveal new warnings. Always re-collect before proceeding.

### Phase 4: Manual Fix — One Warning at a Time

For each remaining warning, fix it and **immediately verify**:

```
1. Read the warning line → understand what clippy wants
2. Make the smallest possible change
3. cargo clippy --all-features -- -D warnings  ← verify THIS warning is gone
4. Check that no NEW warnings appeared
5. If new warnings → fix those too before moving on
6. Repeat for next warning
```

**Never batch multiple manual fixes without verifying between them.** One fix
can mask another or create a cascade. Fix → verify → next.

### Phase 5: Strategic Suppression

For warnings that genuinely can't/shouldn't be fixed, suppress with documentation:

```rust
// ✅ Good suppressions

#[allow(clippy::too_many_arguments)]
// All 7 fields are mathematically required for Schubert intersection computation;
// grouping them into a builder would obscure the invariant that all must be set
pub fn compute_intersection(
    grassmannian: &Grassmannian,
    classes: &[SchubertClass],
    engine: ComputationEngine,
    config: IntersectionConfig,
    cache: &mut ChowRingCache,
    audit: &dyn AuditSink,
    policy: &Policy,
) -> Result<IntersectionResult> { ... }

#[allow(clippy::type_complexity)]
// Rückert14 iterator pipeline — each step transforms the algebraic structure.
// Flattening would require intermediate named types for each stage.
type Rückert14Pipeline = FilterMap<
    Map<Zip<Iter<SchubertClass>, Cycle<Iter<usize>>>, fn((&SchubertClass, usize)) -> ...>,
    fn(...) -> Option<...>,
>;
```

**Suppression comment rules:**
- State WHAT the type/function is
- State WHY the complexity exists (mathematical/architectural reason)
- State what WOULD be needed to eliminate the warning

### Phase 6: Feature-Specific Warnings

Some warnings only appear in specific feature combinations. After fixing default
and all-features, work through individual features:

```bash
# Run clippy on each feature, fail on warnings
for feat in $(list_features); do
    echo "=== $feat ==="
    cargo clippy --no-default-features --features "$feat" -- -D warnings || echo "FAILED: $feat"
done
```

**Common feature-specific issues:**
- `#[cfg(feature = "wasm")]` dead code when built without wasm
- `#[cfg(feature = "serde")]` unused imports when serde is off
- Feature-gated modules with unused use statements in non-gated code

Fix pattern for conditional dead code:
```rust
// Wrap the import in the same cfg
#[cfg(feature = "serde")]
use serde::{Serialize, Deserialize};

// Or allow when the complexity is structural
#[cfg_attr(not(feature = "serde"), allow(dead_code))]
struct SerializableState { ... }
```

### Phase 7: Final Verification

```bash
# The golden command — must produce zero output
cargo clippy --all-features -- -D warnings 2>&1

# Verify: no warnings on any feature combo
for feat in $(list_features); do
    cargo clippy --no-default-features --features "$feat" -- -D warnings || exit 1
done

# Verify: doc tests also clean
cargo test --all-features --doc
```

If the golden command produces no output, done. Commit:

```bash
git add -A
git commit -m "chore: fix all clippy warnings across feature combinations

- Fixed [N] manual warnings
- Suppressed [M] warnings with documented #[allow] annotations
- All feature combinations now pass clippy -D warnings"
```

## Common IA-Specific Warnings

| Warning | Typical IA Cause | Action |
|---|---|---|
| `too_many_arguments` | Schubert calculus functions with k, n, config, engine, policy, audit | Usually suppress — mathematical domain requires these |
| `type_complexity` | Iterator chains in Rückert pipelines, holographic binding types | Suppress with pipeline documentation |
| `large_enum_variant` | AccessDecision::Granted with large Configurations field | Box the large variant |
| `module_inception` | `phantom::phantom::PhantomType` re-export chains | Allow with re-export justification |
| `dead_code` in feature-gated code | WASM-only types not gated at definition site | Add `#[cfg(feature = "...")]` |
| `unused_imports` | Feature-gated dependencies | Gate imports with same cfg |
| `redundant_clone` | Cloning before feature-gated call | Check if clone is needed in some feature paths |
| `needless_lifetimes` | Elided lifetimes in impl blocks | Let the compiler elide |

## Quick Reference

```bash
# Survey all warnings
cargo clippy --all-features 2>&1 | grep warning | wc -l

# Auto-fix mechanical issues
cargo clippy --fix --allow-dirty --allow-staged

# Golden check (zero output = success)
cargo clippy --all-features -- -D warnings

# Feature-by-feature
for f in std serde parallel wasm crypto; do
    cargo clippy --no-default-features --features "$f" -- -D warnings
done
```

## Related Skills

- `/skill:ia-coding-standards` — The standards this enforces (zero warnings is non-negotiable)
- `/skill:ia-release-polish` — Clippy check is step 2 of release polish
