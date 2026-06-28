---
name: ia-release-polish
description: Use when preparing an existing Industrial Algebra Rust crate for public release — polishing for crates.io, making a repo public, or reaching v0.1.0 readiness. NOT for writing code.
---

# IA Release Polish

## Overview

Bring an Industrial Algebra Rust crate to Schubert-level release quality. Covers every
non-obvious step that separates a working crate from a polished public product.

**REQUIRED BACKGROUND:** For the code quality standards underlying this checklist,
see `/skill:ia-coding-standards`. For the branching and PR workflow, see the
Git Workflow section in that skill — IA gitflow is non-negotiable.

## When to Use

- Preparing first public release (v0.1.0)
- Making a private repo public
- Publishing to crates.io for the first time
- After a user says "polish this for release" or "prepare for public"

## The Checklist — Execute in Order

### 1. Cargo.toml — Production Dependencies

```
□ All path deps replaced with crates.io version deps
  amari-enumerative = { version = "0.23", features = [...] }
  karpal-proof = { version = "0.5", optional = true }
  NOT: path = "../amari/..."

□ Nightly toolchain with rustfmt + clippy components
  rust-toolchain.toml: channel = "nightly", components = ["rustfmt", "clippy"]

□ License: Apache-2.0 (valid SPDX)
  CLA referenced in CONTRIBUTING; no LICENSE-COMMERCIAL needed

□ CLA at github.com/Industrial-Algebra/.github/blob/main/CLA.md referenced from CONTRIBUTING

□ All optional deps gated behind features in [features]
  Each feature = ["dep:crate-name"] or similar

□ Keywords and categories populated (max 5 categories)
```

### 2. CI/CD — All Checks Green

Create `.github/workflows/ci.yml`:
```
□ fmt check (cargo fmt --check)
□ clippy with ALL feature combinations (zero warnings required)
□ Test matrix: at minimum --features "serde,karpal,parallel" combos
□ Documentation: cargo doc --no-deps
□ WASM build (if applicable): cargo check --target wasm32-unknown-unknown
□ Property tests (if karpal/proptest): separate workflow
```

Create `.github/workflows/publish.yml`:
```
□ Triggers on v* tag push
□ cargo publish --token ${{ secrets.CARGO_REGISTRY_TOKEN }}
```

The clippy step MUST check `--all-features` and fail on any warning:
```yaml
- name: Clippy (all features)
  run: cargo clippy --all-features -- -D warnings
```

### 3. Documentation — Deployable mdBook

```
□ book.toml with Navy theme, custom CSS matching Orlando style
□ book/theme/custom.css — dark bg, Inter+JetBrains Mono, cyan accents
□ book/theme/head.hbs — Google Fonts preload
□ book/src/SUMMARY.md — minimum 5 sections
□ book/src/introduction.md + getting-started.md
□ netlify.toml — mdBook build + publish config
□ .github/workflows/docs.yml — deploy on v* tag
```

**Required book sections** (minimum):
1. Introduction — what it is, why it exists
2. Getting Started — install, first working example
3. Concepts — mathematical/architectural foundation
4. Guide — installation, feature flags, policy/config, API patterns
5. API Reference — one page per major public module
6. Design — security considerations, verification (if applicable), critique/roadmap
7. Examples — one page per runnable example

Copy the theme from Orlando's `book/theme/` directory. Do not invent new styles.

### 4. README — Public Face

```
□ Project description (1-2 sentences, non-technical first)
□ Killer feature / unique value proposition
□ Quick start code block (copy-paste runnable)
□ Documentation section linking to guides, API, mdBook
□ Feature flags table
□ License section (Apache-2.0 + CLA)
□ Badges (crates.io, docs, CI status)
□ What it IS vs what it is NOT
```

### 5. User-Facing Docs (docs/guide/)

```
□ getting-started.md — install, first controller, Grassmannian selection
□ concepts.md — mathematical foundation for non-mathematicians
□ architecture.md — module map, data flow diagram, dependency graph
□ cookbook.md — integration recipes (OAuth, JWT, databases, K8s)
□ feature-flags.md — all features with combinations and no_std notes
□ cli.md (if CLI exists) — full subcommand reference
```

### 6. Examples — Runnable Code

```
□ At least 3 examples covering different use cases
□ Each example compiles and runs: cargo run --example <name>
□ Examples in Cargo.toml: [[example]] section for each
□ Policy/config files in examples/policies/ (if applicable)
```

### 7. Release Artifacts

```
□ CHANGELOG.md — v0.1.0 with all features listed
□ docs/ROADMAP.md — all completed items marked, speculative items bannered
□ docs/critique.md — honest self-assessment with v0.1.0 snapshot banner
□ HANDOFF.md — DELETED (internal agent scaffolding, not a public artifact)
```

**Critique must note what's been addressed** (CLI built, dual-license added, docs written).
Frame as an honest record, not a marketing document.

### 8. Security & Trust

```
□ docs/ or book section on security considerations
□ Covers: identity model, capability design, trust boundaries
□ Known limitations listed honestly
□ If applicable: cryptographic token security, key management
```

### 9. Literature Survey (Optional — for novelty claims)

```
□ Systematic search across major databases
□ Japanese domain search (relevant for IA ecosystem)
□ 10+ novelty claims documented
□ arXiv preprint recommended for priority establishment
□ Defensive publication note in survey header
```

### 10. Discovery & CLI

```
□ If CLI exists: discover, recommend, explore subcommands
□ discover subcommand for LLM agent function discovery
□ One-shot evaluator for LLM tool-calling (--eval flag)
□ CLI guide in docs/guide/cli.md and book/src/guide/cli.md
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Path deps in Cargo.toml | Replace with `version = "X.Y"` |
| License "Apache-2.0" | Use `Apache-2.0` in Cargo.toml; CLA in CONTRIBUTING |
| Clippy only checked on default features | Run `cargo clippy --all-features -- -D warnings` |
| Docs written but no deploy config | Add `netlify.toml` + `.github/workflows/docs.yml` |
| HANDOFF.md left in repo | Delete it — it's internal agent context |
| Critique doc is marketing | Frame as honest self-assessment with v0.1.0 banner |
| README has no Documentation section | Add section linking to guides, book, API |
| Examples don't compile | Add `cargo run --example <name>` to CI |
| No feature flag guide | Create `docs/guide/feature-flags.md` |
| CI doesn't test all feature combos | Add matrix or multiple test steps |

## Red Flags — STOP and Fix

- Path deps in Cargo.toml
- `cargo clippy` produces warnings on any feature combination
- No CI workflows
- README has no quick start code block
- Documentation is in one README, not a deployable book
- HANDOFF.md still in the repo
- No CHANGELOG
- License field contains "OR Commercial" (crates.io will reject)
- No security considerations section anywhere
- Direct commits to develop or main (no branch → PR → review)
- Missing branch prefix (not feature/fix/chore/docs/)
- Squash-merge of release PRs (preserve history on develop → main)

**All of these mean: The repo is not release-ready.**

## Reference Repo

Schubert (Industrial-Algebra/Schubert) is the gold standard. When in doubt, check:
- `Cargo.toml` — feature gates, version deps, license
- `.github/workflows/` — ci.yml, docs.yml, publish.yml, schubert-verify.yml
- `book/` — mdBook structure, theme, SUMMARY.md
- `docs/guide/` — user-facing documentation
- `docs/ROADMAP.md`, `docs/critique.md` — snapshot banners
- `netlify.toml` — deploy config
- `README.md` — public face template
