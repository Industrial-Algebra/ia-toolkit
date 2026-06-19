---
name: ia-mcp-manifest
description: Generate and validate TOML manifests for IA-MCP and amari-mcp servers. Describes a Rust library's crates, features, and aliases so the MCP server can index and serve its API surface. Use when adding a new library to an IA-MCP server, or when a crate's structure changes and the manifest needs updating.
---

# IA MCP Manifest

## Overview

Generate or update a TOML manifest that tells IA-MCP (or amari-mcp) how to index
a Rust library. The manifest describes the workspace structure, which crates to
expose, optional/feature-gated crates, and short aliases for tool-friendly names.

## Background

IA-MCP and amari-mcp are config-driven MCP servers that parse Rust source code
with `syn` and serve accurate API reference via the Model Context Protocol.
Each indexed library needs a manifest file in the server's `manifests/` directory.

These servers are what power the `ia_mcp_*` tools available in this pi session.

## When to Use

- Adding a new IA crate to an MCP server's index
- User says "add X to IA-MCP" or "create manifest for Y"
- Crate structure changed (new sub-crates, renamed crates, new features)
- Validating that an existing manifest matches the current source

## Manifest Format

### Full Example (Multi-Crate Workspace)

```toml
# Library manifest for CrateName
# Brief description of what this library provides

[library]
name = "cratename"
display_name = "CrateName"
version = "0.1.0"
description = "What this library provides — shown in MCP server listings"
repository = "https://github.com/Industrial-Algebra/cratename"
docs_url = "https://docs.rs/cratename"
source_path = "../../cratename"

[workspace]
root_cargo_toml = "Cargo.toml"
umbrella_crate = "src/lib.rs"

[crates.default]
members = [
    "cratename-core",
    "cratename-extra",
]

[crates.optional]
extra = "cratename-extra"

[crates.internal]
members = [
    "cratename-macros",
]

[aliases]
cratename-core = "core"
cratename-extra = "extra"
```

### Single-Crate Library

```toml
[library]
name = "cratename"
display_name = "CrateName"
version = "0.1.0"
description = "What this library provides"
repository = "https://github.com/Industrial-Algebra/cratename"
source_path = "../../cratename"

[workspace]
root_cargo_toml = "Cargo.toml"
umbrella_crate = "src/lib.rs"

# Empty members triggers root-as-crate fallback
[crates.default]
members = []

[crates.optional]

[aliases]
```

## Workflow

### 1. Survey the Library

Before writing the manifest, read:
- The workspace `Cargo.toml` — `[workspace.members]`, `[workspace.dependencies]`, `[features]`
- Each sub-crate's `Cargo.toml` — to understand its role
- The umbrella/root `src/lib.rs` — crate-level docs, re-exports

Determine:
- **All crates** in the workspace (including proc-macro crates)
- **Public API crates** — the ones users import → go in `crates.default`
- **Feature-gated crates** — behind optional features → go in `crates.optional`
- **Internal crates** — proc macros, wasm glue, test-only → go in `crates.internal`
- **Source root** — where `Cargo.toml` and `src/` live relative to the manifest

### 2. Determine source_path

The `source_path` is relative from the manifest file to the library source root.

If the manifest lives at `IA-MCP/manifests/cratename.toml` and the library is at
`../working/cratename/`, the path is `../../working/cratename`.

```bash
# From the manifests directory:
realpath --relative-to=. /path/to/library
```

### 3. Classify Crates

| Category | Example | When |
|---|---|---|
| `default` | `amari-core`, `karpal-proof` | Always compiled, core API surface |
| `optional` | `amari-gpu`, `amari-holographic` | Behind a feature gate that users opt into |
| `internal` | `amari-flynn-macros` | Proc macros, build deps, not public API |

**Rule:** If a crate exists in `[workspace.members]` but isn't listed in `default`,
`optional`, or `internal`, the MCP server will skip it.

### 4. Create Aliases

Aliases give each crate a short, tool-friendly name:

```toml
[aliases]
amari-enumerative = "enumerative"
karpal-schubert-types = "schubert_types"
```

**Convention:** Strip the workspace prefix, convert hyphens to underscores.
- `amari-core` → `core`
- `karpal-proof` → `proof`
- `cliffy-wasm` → `wasm`

**Avoid collisions.** If two crates would produce the same alias (e.g., `amari-flynn`
and `amari-flynn-macros` both wanting `"flynn"`), use longer aliases:
```toml
amari-flynn = "flynn"
amari-flynn-macros = "flynn_macros"
```

### 5. Set umbrella_crate

The `umbrella_crate` is the path to the crate root's `lib.rs` relative to
`source_path`. This is what the MCP server indexes as the crate entry point.

- **Workspace with umbrella crate:** `"src/lib.rs"` (the workspace root has its own lib)
- **Workspace without umbrella:** `"karpal-core/src/lib.rs"` (use the primary crate's lib)
- **Single crate:** `"src/lib.rs"`

**Check:** Does `source_path/Cargo.toml` have a `[lib]` section? If yes, use the
path from `[lib].path` (defaults to `src/lib.rs`).

### 6. Validate the Manifest

```bash
# From the MCP server directory
cargo run -- check --manifests-dir manifests/

# Or validate a specific manifest
cargo run -- check --manifest manifests/cratename.toml
```

The server's `check` command validates:
- `source_path` resolves to a readable directory
- `root_cargo_toml` exists and is valid TOML
- `umbrella_crate` exists and parses as Rust
- All crate names in `members` exist in the workspace
- Aliases don't collide

### 7. Test the Index

```bash
# Start the MCP server (stdio mode) and verify tools work
cargo run -- serve --manifests-dir manifests/

# In another terminal, test via MCP inspector or Claude Code
```

The `ia_mcp_module_overview`, `ia_mcp_type_info`, and `ia_mcp_api_search` tools
should all return results for the new library.

## Common Patterns

### Workspace with Many Feature-Gated Crates (amari-style)

```toml
[crates.default]
members = [
    "amari-core",
    "amari-tropical",
    "amari-dual",
    "amari-enumerative",
    # ... core crates always available
]

[crates.optional]
gpu = "amari-gpu"
holographic = "amari-holographic"
# Key = feature name, Value = crate name
# These only get indexed when the feature is enabled
```

### Workspace with Parse-Only Internal Crates (karpal-style)

```toml
[crates.default]
members = [
    "karpal-core",
    "karpal-profunctor",
    "karpal-optics",
]

# Proc macros are internal — they exist at compile time
# but don't expose a public API to index
[crates.internal]
members = [
    "karpal-proof-derive",
    "karpal-verify-derive",
]
```

### Single-Crate Library (minuet-style)

```toml
[library]
name = "minuet"
source_path = "../../Minuet"

[workspace]
root_cargo_toml = "Cargo.toml"
umbrella_crate = "src/lib.rs"

[crates.default]
members = []    # Empty → server indexes root crate directly

[crates.optional]
# No optional sub-crates for single-crate libraries

[aliases]
# Empty — single crate doesn't need aliases
```

## Manifest File Naming

- **File name:** `library-name.toml` (lowercase, match `[library].name`)
- **Location:** In the MCP server's `manifests/` directory
- **Naming rule:** The file name doesn't drive behavior (the `[library].name` field does), but keeping them consistent avoids confusion

## Common Pitfalls

| Mistake | Fix |
|---|---|
| `source_path` is absolute | Must be relative from the manifest file |
| Forgot `crates.internal` for proc-macro crates | Add them or the server will try to index proc macros as API |
| `umbrella_crate` points to non-existent file | Check the path — it's relative to `source_path` |
| Alias collision | Two crates with the same alias → server startup error |
| New sub-crate not in manifest | Add to `members` — unlisted crates are invisible to the MCP server |
| Manifest lists deleted crate | Remove from `members` — stale references cause parse errors |
| `version` doesn't match Cargo.toml | Keep in sync — used for display purposes |

## Related Skills

- `/skill:ia-coding-standards` — Manifest libraries should follow IA coding standards
- `/skill:ia-workspace-new-crate` — When adding crates, update the manifest too
