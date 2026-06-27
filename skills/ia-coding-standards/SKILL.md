---
name: ia-coding-standards
description: Use when writing or reviewing Rust code in the Industrial Algebra ecosystem — implementing features, reviewing PRs, or working in amari/karpal/schubert/minuet style.
---

# IA Coding Standards

## Overview

Industrial Algebra Rust code follows strict conventions that produce composable,
formally grounded, release-ready crates. Every pattern serves a purpose: phantom
types for compile-time verification, feature gates for additive capability, TDD
for correctness, and ecosystem composability for reuse.

## When to Use

- Starting a new IA crate
- Writing implementation code for any IA project
- Reviewing an IA pull request
- Refactoring existing IA code
- When unsure about coding style or patterns

## Core Principles

1. **Composability over monoliths** — small crates that compose via features
2. **Correctness at compile time** — phantom types, type states, exhaustive matching
3. **Zero warnings** — clippy across all feature combinations
4. **Every public item documented** — doc tests where meaningful
5. **Ecosystem first** — use amari/karpal/minuet before writing from scratch

## 1. Test-Driven Development (Non-Negotiable)

```
RED   → Write failing test
GREEN → Write minimal code to pass
REFACTOR → Clean up while keeping green
```

**Iron Law: No implementation code before a failing test.**

```rust
// ✅ Correct: Test first
#[test]
fn grant_then_check_returns_granted() {
    let mut acl = AccessController::new(2, 4).unwrap();
    let alice = acl.create_principal("alice").unwrap();
    acl.grant(&alice, "read").unwrap();
    let result = acl.check(&alice, &["read"]).unwrap();
    assert!(result.is_granted());
}

// Then implement grant() and check()

// ❌ Wrong: Implementation first, tests after
impl AccessController {
    pub fn grant(&mut self, p: &PrincipalId, cap: &str) -> Result<()> {
        // ... 50 lines of implementation with no test coverage
    }
}
```

### Test Structure
- Unit tests in the same file: `#[cfg(test)] mod tests { ... }`
- Doc tests on all public functions with non-trivial behavior
- Property tests for algebraic laws (commutativity, associativity, identity)
- Golden tests for verification output (Karpal)

## 2. Phantom Types & Algebraic Patterns

IA code uses compile-time verification wherever possible.

### Phantom Types for Type Safety

```rust
// ✅ Use phantom types from amari
use amari_enumerative::phantom::Namespace;

pub struct PrincipalId(Namespace);

// ✅ Newtype wrappers for domain concepts
pub struct CapabilityId(String);

// ✅ Exhaustive enums for decision types
pub enum AccessDecision {
    Granted { configurations: usize },
    Impossible { conflicting: Vec<String> },
    Denied,
    Underconstrained { dimension: usize },
}

// ❌ Don't use raw strings where domain types exist
fn check(principal: &str, caps: &[&str]) -> bool { ... }
//                              ^ no type safety
```

### Result, Not Panic

```rust
// ✅ Return Result — never panic in library code
pub fn new(k: usize, n: usize) -> Result<Self, SchubertError> {
    if k == 0 || k >= n {
        return Err(SchubertError::InvalidGrassmannian { k, n });
    }
    Ok(Self { ... })
}

// ❌ Never unwrap/expect in library code
pub fn new(k: usize, n: usize) -> Self {
    assert!(k > 0 && k < n); // Panic is NOT an API
    Self { ... }
}
```

### Match Must Be Exhaustive

```rust
// ✅ Exhaustive match — compiler catches new variants
match decision {
    AccessDecision::Granted { configurations } => { ... }
    AccessDecision::Impossible { conflicting } => { ... }
    AccessDecision::Denied => { ... }
    AccessDecision::Underconstrained { dimension } => { ... }
}

// ❌ Wildcard match hides new variants
match decision {
    AccessDecision::Granted { .. } => { ... }
    _ => { ... } // New variants silently fall through
}
```

## 3. Feature Gates — Additive Only

Every optional dependency is behind a feature. Features never remove functionality.

```toml
# ✅ Correct: Additive features
[features]
default = ["std"]
std = []
serde = ["amari-enumerative/serde"]  # serde is always available but feature controls impls
crypto = ["dep:ed25519-dalek", "dep:rand"]
surreal = ["dep:amari-surreal"]

[dependencies]
serde = { version = "1", features = ["derive"] }  # non-optional, always compiled
ed25519-dalek = { version = "2", optional = true }  # behind crypto feature
amari-surreal = { version = "0.23", optional = true }  # behind surreal feature
```

```rust
// ✅ Feature-gated module
#[cfg(feature = "crypto")]
pub mod crypto;

// ✅ Feature-gated impl block
#[cfg(feature = "crypto")]
impl AccessController {
    pub fn verify_token(&self, token: &CapabilityToken) -> Result<()> { ... }
}

// ❌ Never: feature removes existing API
#[cfg(not(feature = "wasm"))]  // WASM feature shouldn't REMOVE std functionality
```

### Feature Flag Documentation

Every feature must be documented in `src/lib.rs`:
```rust
//! ## Features
//!
//! - `std` (default): HashMap, SystemTime, thread-safe audit
//! - `serde`: Serialize/Deserialize impls
//! - `crypto`: Ed25519 capability tokens
```

## 4. IA Ecosystem — Compose, Don't Recreate

Before writing new code, check if the IA ecosystem already provides it:

| Need | Use |
|---|---|
| Schubert calculus / Grassmannians | `amari-enumerative` |
| Multivector / geometric algebra | `amari-core` |
| Surreal numbers | `amari-surreal` |
| Type-level proofs | `karpal-proof` |
| Formal verification | `karpal-verify` |
| Schubert types for Karpal | `karpal-schubert-types` |
| Holographic memory | `minuet` |

```rust
// ✅ Use ecosystem types
use amari_enumerative::SchubertCalculus;  // Don't implement your own
use karpal_proof::Proven;                // Don't build custom proof types

// ❌ Don't reimplement ecosystem functionality
struct MySchubertEngine { ... }  // amari already provides this
```

### Phantom Type Re-export

If your crate wraps ecosystem types, re-export them:
```rust
// In your crate's phantom module
pub use amari_enumerative::phantom;
```

## 5. Error Types — thiserror

```rust
// ✅ Use thiserror derive macros
#[derive(Error, Debug)]
pub enum SchubertError {
    #[error("invalid Grassmannian: Gr({k},{n}) requires 0 < k < n")]
    InvalidGrassmannian { k: usize, n: usize },

    #[error("capability '{0}' not found")]
    CapabilityNotFound(String),

    #[error("geometrically impossible composition: {reason}")]
    ImpossibleComposition { reason: String },
}

// ❌ Don't use string errors
fn do_thing() -> Result<(), String> { ... }
```

- Every error variant has `#[error("...")]` with a descriptive message
- Variant names are PascalCase, descriptive
- Include relevant context in variant fields (not just a string)

## 6. Documentation — Concurrent, Not Afterthought

Document AS you code, not after.

```rust
/// Creates a new access controller on the Grassmannian Gr(k,n).
///
/// The Grassmannian Gr(k,n) is the space of k-dimensional subspaces
/// of n-dimensional space. It serves as the policy space.
///
/// # Examples
///
/// ```
/// use schubert::AccessController;
/// let acl = AccessController::new(2, 4)?;
/// # Ok::<(), schubert::SchubertError>(())
/// ```
///
/// # Errors
///
/// Returns `InvalidGrassmannian` if k == 0 or k >= n.
pub fn new(k: usize, n: usize) -> Result<Self, SchubertError> { ... }
```

**Every public item MUST have:**
- One-line summary (first line)
- Description paragraph
- `# Examples` section with runnable doc test (for functions)
- `# Errors` section (for fallible functions)
- `# Panics` section (if applicable — rare in IA code)

## 7. Parallel & Performance

```rust
// ✅ Use rayon for batch operations (behind parallel feature)
#[cfg(feature = "parallel")]
pub fn check_batch(
    &self,
    queries: &[(PrincipalId, Vec<&str>)],
) -> Result<Vec<AccessDecision>> {
    use rayon::prelude::*;
    queries
        .par_iter()
        .map(|(p, caps)| self.check(p, caps))
        .collect()
}
```

- Batch operations behind `parallel` feature
- Sequential fallback when `parallel` is disabled
- Rayon for CPU-bound work, not I/O

## 8. File Structure

```
src/
├── lib.rs          # Re-exports, feature docs, crate-level docs
├── main.rs         # CLI binary (if applicable)
├── controller.rs   # One module per major concept
├── capability.rs
├── decision.rs
├── error.rs        # Centralized error types
├── phantom.rs      # Re-exports ecosystem phantom types
├── cli/            # CLI submodules (if applicable)
│   ├── mod.rs
│   ├── discover.rs
│   └── ...
└── audit.rs

tests/
├── integration.rs  # Integration tests
└── golden/         # Golden file tests (if applicable)
```

- One module per concept — don't cram unrelated types into one file
- `error.rs` is central — one error enum for the whole crate
- `phantom.rs` re-exports from ecosystem
- `lib.rs` re-exports all public types, documents features

## 9. License & Attribution

Every `.rs` file starts with:
```rust
// Copyright (C) 2026 Industrial Algebra
// SPDX-License-Identifier: AGPL-3.0-only
```

## 10. Git Workflow — IA Gitflow (Non-Negotiable)

All IA repos follow a strict gitflow pattern with zero exceptions.

```
feature/* ──PR──► develop ──release PR──► main
chore/*
bugfix/*
docs/*
```

### Branch Naming

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New functionality | `feature/surreal-trust` |
| `bugfix/` | Bug fixes | `bugfix/clippy-path-keyword` |
| `chore/` | Maintenance, CI, deps | `chore/update-amari-0.23` |
| `docs/` | Documentation only | `docs/user-guide` |

### PR Flow

1. Branch from `develop`
2. Implement with TDD (test first)
3. Open PR against `develop`
4. ALL CI checks MUST pass (fmt, clippy −D warnings, test matrix, docs, wasm)
5. PR reviewed and merged by human — NEVER auto-merge
6. Repeat for each feature

### Release Flow

1. All feature PRs merged to `develop`
2. Create release PR: `develop` → `main`
3. Release PR body lists all changes with PR numbers
4. Merge release PR (no squash — preserve history)
5. Tag on `main`: `git tag -a v0.1.0 -m "..."`
6. Push tag: `git push origin v0.1.0`
7. CI auto-publishes to crates.io and deploys docs

### Why No Auto-Merge

PRs target `develop` for human review. The reviewer verifies:
- TDD cycle followed (tests before implementation)
- All public items documented
- Feature gates are additive only
- No ecosystem duplication
- CI is green before merge

### Commit Messages

```
prefix: brief description

- bullet points for details
- breaking changes flagged with !
```

Prefixes match branch types: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`.

## 11. Toolchain & CI Expectations

```toml
# rust-toolchain.toml
[toolchain]
channel = "nightly"
components = ["rustfmt", "clippy"]
```

All CI MUST pass:
- `cargo fmt --check`
- `cargo clippy --all-features -- -D warnings`
- `cargo test --all-features`
- `cargo doc --no-deps`

## Common Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `unwrap()` in library code | Return `Result` |
| Raw strings for domain concepts | Newtype wrappers |
| `_ => {}` in match arms | Exhaustive match on all variants |
| 500-line functions | Extract sub-functions, each <50 lines |
| No doc tests | Add `# Examples` to every public fn |
| Reimplementing ecosystem types | Import from amari/karpal/minuet |
| Feature removes API | Features are additive only |
| `todo!()` or `unimplemented!()` in merged code | Implement or feature-gate properly |
| `#[allow(clippy::...)]` without comment | Fix the warning or document why |

## Quick Reference Table

| Pattern | Syntax |
|---|---|
| TDD | Test first, then implement |
| Phantom type | `pub struct Id(Namespace);` |
| Error type | `#[derive(Error, Debug)] pub enum MyError { ... }` |
| Feature gate | `#[cfg(feature = "crypto")]` |
| Doc test | `/// # Examples \n /// ``` \n /// ... \n /// ``` ` |
| Batch parallel | `queries.par_iter().map(...).collect()` |
| Newtype | `pub struct CapabilityId(String);` |
| Exhaustive match | Match all enum variants, no `_` wildcard |
| License header | `// Copyright (C) 2026 Industrial Algebra` |
