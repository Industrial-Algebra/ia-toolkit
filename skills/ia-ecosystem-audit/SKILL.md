---
name: ia-ecosystem-audit
description: Audit an Industrial Algebra Rust crate against IA coding standards. Checks TDD compliance, phantom types, error patterns, feature gates, documentation, and structural conventions. Use when reviewing a PR, assessing a new crate, or before running release polish. Produces a pass/fail report with specific line references.
---

# IA Ecosystem Audit

## Overview

Run a systematic audit of an IA Rust crate against the coding standards defined
in `/skill:ia-coding-standards`. Produces a structured report: what passes, what
fails, and exactly where the issues are. Like a linter for IA conventions.

**This is a review skill, not a fix skill.** It identifies problems but does not
modify code. For fixing, run `/skill:ia-clippy-hammer` for clippy issues and
manually address the audit findings.

## When to Use

- Reviewing a pull request
- Assessing a new crate entering the IA ecosystem
- Before running `/skill:ia-release-polish` (catches issues early)
- User says "audit this crate" or "check against IA standards"
- Periodic health check on an existing crate

## The Audit Checklist

Run each check and record PASS ✓ or FAIL ✗ with specific evidence (file:line).

### 1. TDD Compliance

```
□ Every public function has at least one test
□ Tests use #[cfg(test)] mod tests { ... } in the same file
□ No implementation code without corresponding test coverage
□ Doc tests on public functions with non-trivial behavior
```

Check method:
```bash
# Count public fns without tests
rg "pub fn " src/ --files-without-match '#\[test\]' -l
```

**FAIL if:** A public module has 0 test functions in its `#[cfg(test)]` block.

### 2. Phantom Types & Algebraic Patterns

```
□ Domain concepts use newtype wrappers (not raw strings/ints)
□ Result<T, E> used for all fallible operations (no panics in library code)
□ No unwrap(), expect(), panic!() in library code (src/, not tests/)
□ Match arms are exhaustive (no _ wildcard on enums with < 10 variants)
```

Check method:
```bash
# Find raw unwrap/expect in library code
rg "\.unwrap\(\)|\.expect\(|panic!\(" src/ --type rust

# Find wildcard match on enums
rg "=> \{" src/ --type rust | rg "_ "
```

**FAIL if:** Any `unwrap()` or `expect()` found in `src/` (not `tests/`).

### 3. Error Types

```
□ Errors use thiserror derive macros (#[derive(Error, Debug)])
□ Every error variant has #[error("...")] with descriptive message
□ Variant names are PascalCase, descriptive
□ No String or Box<dyn Error> as error types
□ One error enum per crate (in src/error.rs)
```

Check method:
```bash
# Find error enums
rg "#\[derive\(.*Error" src/ --type rust -A5

# Find string errors (anti-pattern)
rg "Result<.*String>" src/ --type rust
```

**FAIL if:** `Result<..., String>` found in public API, or `thiserror` not in `Cargo.toml`.

### 4. Feature Gates

```
□ All optional deps gated behind features in [features]
□ Features are additive only (no feature removes API)
□ Feature flags documented in crate-level docs (//! ## Features)
□ No #[cfg(not(feature = "X"))] that removes functionality
```

Check method:
```bash
# Verify feature docs exist
rg "^//! ## Features" src/lib.rs

# Find subtractive feature gates (anti-pattern)
rg "#\[cfg\(not\(feature" src/ --type rust
```

**FAIL if:** `#![cfg(not(feature = ...))]` found, or `//! ## Features` missing from lib.rs.

### 5. Documentation Completeness

```
□ Every public item has a doc comment (/// or //!)
□ Public functions have # Examples section with runnable code
□ Fallible functions have # Errors section
□ Crate-level docs (//! at top of lib.rs) describe the crate's purpose
□ Feature flags documented in crate-level docs
```

Check method:
```bash
# Count undocumented public items
cargo doc --no-deps 2>&1 | rg "warning.*undocumented"

# Check for Examples section on public fns
rg "pub fn " src/ --type rust -A10 | rg -c "# Examples"
```

**FAIL if:** `cargo doc` produces any "undocumented" warnings.

### 6. License Headers

```
□ Every .rs file starts with license header:
  // Copyright (C) 2026 Industrial Algebra
  // SPDX-License-Identifier: AGPL-3.0-only
```

Check method:
```bash
# Find files missing the SPDX header
find src/ -name '*.rs' -exec sh -c 'head -2 "$1" | rg -q "SPDX-License-Identifier" || echo "MISSING: $1"' _ {} \;
```

**FAIL if:** Any `.rs` file in `src/` lacks the SPDX line in its first 3 lines.

### 7. Workspace Structure

```
□ Cargo.toml uses workspace inheritance where available
□ src/error.rs exists and is the single source of error types
□ src/lib.rs re-exports all public types
□ src/phantom.rs re-exports ecosystem phantom types (if applicable)
□ One module per concept (no 500-line files with mixed concerns)
```

Check method:
```bash
# Check file sizes
find src/ -name '*.rs' -exec wc -l {} \; | sort -rn | head -10

# Verify error.rs exists
ls src/error.rs
```

**FAIL if:** Any file > 500 lines without clear justification, or `error.rs` missing.

### 8. Ecosystem Composability

```
□ Uses amari/karpal/minuet types where applicable (not reinventing)
□ Phantom types re-exported from ecosystem (not duplicated)
□ Depends on ecosystem crates via version = "X.Y" (not path = "...")
```

Check method:
```bash
# Find path dependencies in Cargo.toml
rg 'path = "(?!\.\./)"' Cargo.toml

# Check for ecosystem usage
rg "amari|karpal|minuet|schubert" Cargo.toml --type toml
```

**FAIL if:** Path dependencies to ecosystem crates found in Cargo.toml (should be version deps).

### 9. CI Readiness

```
□ .github/workflows/ci.yml exists
□ CI includes: fmt check, clippy --all-features, test --all-features, docs
□ rust-toolchain.toml is present with nightly channel
```

Check method:
```bash
ls .github/workflows/ci.yml rust-toolchain.toml
```

**FAIL if:** Either file is missing.

## Audit Report Format

Produce the report in this structure:

```markdown
# IA Ecosystem Audit: crate-name vX.Y.Z

**Date:** YYYY-MM-DD
**Audited by:** pi agent

## Summary

| Category | Status |
|---|---|
| TDD Compliance | ✓ PASS / ✗ FAIL |
| Phantom Types & Patterns | ✓ PASS / ✗ FAIL |
| Error Types | ✓ PASS / ✗ FAIL |
| Feature Gates | ✓ PASS / ✗ FAIL |
| Documentation | ✓ PASS / ✗ FAIL |
| License Headers | ✓ PASS / ✗ FAIL |
| Workspace Structure | ✓ PASS / ✗ FAIL |
| Ecosystem Composability | ✓ PASS / ✗ FAIL |
| CI Readiness | ✓ PASS / ✗ FAIL |

**Overall: X/9 passing**

## Findings

### TDD Compliance — ✗ FAIL
- `src/controller.rs:45`: `pub fn grant()` has no corresponding test
- `src/composition.rs:12-89`: `compose()` module has 0 test functions

### Phantom Types — ✓ PASS
- All domain concepts use newtype wrappers
- No unwrap/expect in library code
- All matches are exhaustive

... (repeat for each failing category)

## Recommendations

1. Add tests for `grant()` and `compose()` before merging
2. Run `cargo doc` to find and fix undocumented items
3. Add SPDX header to `src/new_module.rs`
```

## Severity Levels

| Finding | Severity | Must Fix Before |
|---|---|---|
| Missing license header | **Critical** | Merge |
| `unwrap()` in library code | **Critical** | Merge |
| Path deps to ecosystem crates | **Critical** | Release |
| Missing tests for public fn | **High** | Merge |
| No `# Errors` section on fallible fn | **High** | Release |
| No `//! ## Features` in lib.rs | **Medium** | Release |
| File > 500 lines | **Medium** | Next refactor |
| Missing doc comment on private helper | **Low** | When convenient |

## Quick Audit (One Command)

For a fast first pass, run these checks as a batch:

```bash
# License headers
find src/ -name '*.rs' ! -exec grep -q 'SPDX-License-Identifier' {} \; -print

# Unwrap/expect in library
rg "\.unwrap\(\)|\.expect\(|panic!\(" src/ -n

# String errors
rg "Result<.*String>" src/ -n

# Path deps to ecosystem
rg 'path = "(?!\.\.?/)(?!.*/target)' Cargo.toml

# Undocumented public items
cargo doc --no-deps 2>&1 | rg "warning.*undocumented" | wc -l

# Missing CI
ls .github/workflows/ci.yml 2>/dev/null || echo "MISSING: ci.yml"
ls rust-toolchain.toml 2>/dev/null || echo "MISSING: rust-toolchain.toml"
```

## Related Skills

- `/skill:ia-coding-standards` — The standards this audit checks against
- `/skill:ia-release-polish` — Use audit before release polish to catch issues early
- `/skill:ia-clippy-hammer` — Fix clippy issues the audit might flag
