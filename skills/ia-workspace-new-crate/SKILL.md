---
name: ia-workspace-new-crate
description: Scaffold a new sub-crate inside an Industrial Algebra Rust workspace. Creates Cargo.toml with workspace inheritance, src/lib.rs with license header and crate-level docs, adds to workspace members. Use when creating a new crate in an IA workspace like amari, karpal, cliffy, or schubert.
---

# IA Workspace New Crate

## Overview

Scaffold a new sub-crate inside an existing Industrial Algebra workspace. Handles
all the boilerplate: Cargo.toml with correct workspace inheritance, `lib.rs` with
license header and doc structure, workspace member registration, and README stub.

## When to Use

- Adding a new sub-crate to amari, karpal, cliffy, or any IA workspace
- Splitting a growing module into its own crate
- User says "create a new crate in this workspace"

## Workflow

### 1. Gather Information

Before scaffolding, determine:
- **Workspace root**: The directory containing the top-level `Cargo.toml` with `[workspace]`
- **Crate name**: kebab-case, prefixed with workspace name (e.g., `amari-fusion`, `karpal-optics`)
- **Description**: One line — what this crate provides
- **Keywords**: 3-5 relevant keywords (can match workspace defaults)
- **Categories**: 1-3 from [crates.io categories](https://crates.io/category_slugs)

Read the workspace `Cargo.toml` to understand:
- Whether it uses `[workspace.package]` for shared metadata
- Whether it uses `[workspace.dependencies]` for shared dependency versions
- The existing `members` array format

### 2. Create Crate Directory

```bash
mkdir -p $WORKSPACE_ROOT/$CRATE_NAME/src
```

### 3. Write Cargo.toml

Use workspace inheritance for shared fields. Pattern depends on workspace style.

**Style A — Workspace with package metadata (karpal-style):**
```toml
[package]
name = "karpal-newcrate"
version.workspace = true
edition.workspace = true
license.workspace = true
repository.workspace = true
homepage.workspace = true
keywords.workspace = true
categories.workspace = true
readme = "README.md"
description = "Brief description of what this crate provides"

[features]
default = ["std"]
std = []

[dependencies]

[dev-dependencies]
```

**Style B — Workspace without full package metadata (amari-style):**
```toml
[package]
name = "amari-newcrate"
version.workspace = true
authors.workspace = true
edition.workspace = true
license.workspace = true
description = "Brief description of what this crate provides"
repository = "https://github.com/justinelliottcobb/Amari"
keywords = ["mathematics", "geometry", "combinatorics"]
categories = ["mathematics", "science"]

[dependencies]
amari-core = { workspace = true }

[features]
default = ["std"]
std = []

[dev-dependencies]
```

**Critical:** Match the EXISTING workspace style. If `[workspace.package]` defines `keywords`, use `keywords.workspace = true`. If not, define inline. Never mix styles in one workspace.

### 4. Write src/lib.rs

```rust
// Copyright (C) 2026 Industrial Algebra
// SPDX-License-Identifier: Apache-2.0

//! # Crate Title
//!
//! Brief description of what this crate provides — one paragraph.
//!
//! ## Features
//!
//! - `std` (default): Standard library support
//!
//! ## Usage
//!
//! ```rust
//! // TODO: add example once implemented
//! ```
```

**Every new crate MUST start with:**
- License header (two lines exactly as above)
- Crate-level docs with `//!` including Features section
- `# Usage` section with code block (even if stub)

If the workspace has an existing error crate (like `amari::error` or `schubert::SchubertError`), import it:
```rust
use workspace_error::WorkspaceError;
```

### 5. Add to Workspace Members

Add the crate to `[workspace.members]` in the parent `Cargo.toml`.

**If the workspace uses an explicit list:**
```toml
[workspace]
members = [
    "existing-crate-1",
    "existing-crate-2",
    "new-crate",         # <-- append here
]
```

**If the workspace uses a glob pattern:**
No change needed if the pattern already matches (e.g., `members = ["amari-*"]`).

Insert alphabetically within the existing list. Preserve formatting (indentation, trailing commas, blank lines between groups).

### 6. Create README.md Stub

```markdown
# crate-name

Brief one-liner description.

## License

Apache-2.0. See [LICENSE](../LICENSE) for details.
Commercial licensing available — contact Industrial Algebra.
```

### 7. Verify

```bash
cd $WORKSPACE_ROOT
cargo check -p $CRATE_NAME
```

Fix any issues before declaring the scaffold complete.

## Common Pitfalls

| Mistake | Fix |
|---|---|
| Mixing `workspace = true` with inline values for the same field | Pick one style per field |
| Forgetting the `// SPDX-License-Identifier` line | Always two-line license header |
| No `# Features` section in crate docs | Add before first commit |
| Crate name without workspace prefix | Prefix with workspace name unless standalone |
| Not verifying with `cargo check` | Always run before completing |
| `edition.workspace = true` when workspace doesn't define `[workspace.package].edition` | Define `edition = "2021"` (or 2024) inline |
| Adding dependency without `workspace = true` when it's in `[workspace.dependencies]` | Check workspace deps first |

## Reference Examples

- `amari/amari-enumerative/Cargo.toml` — amari sub-crate with inline keywords/categories
- `karpal/karpal-core/Cargo.toml` — karpal sub-crate with full workspace inheritance
- `Schubert/Cargo.toml` — standalone crate (not a workspace, different pattern)

## Related Skills

- `/skill:ia-coding-standards` — Code conventions for the new crate's contents
- `/skill:ia-release-polish` — When the crate is ready for publication
