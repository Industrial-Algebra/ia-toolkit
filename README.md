# ia-toolkit

Pi package with skills, extensions, and themes for the [Industrial Algebra](https://github.com/Industrial-Algebra) Rust ecosystem.

## Skills

### Development

| Skill | Description |
|---|---|
| `ia-coding-standards` | Coding conventions for IA Rust crates — TDD, phantom types, feature gates, error types, docs, Gitflow |
| `ia-workspace-new-crate` | Scaffold a new sub-crate inside an IA workspace with correct boilerplate |
| `ia-clippy-hammer` | Systematic zero-warning clippy fix across all feature combinations |

### Release & Quality

| Skill | Description |
|---|---|
| `ia-release-polish` | Release checklist for IA crates — Cargo.toml, CI, docs, mdBook, examples, security |
| `ia-version-bump` | Coordinate version bumps across multi-crate workspaces |
| `ia-ecosystem-audit` | Audit a crate against IA coding standards — produces pass/fail report |

### Documentation & Tooling

| Skill | Description |
|---|---|
| `ia-mdbook` | Scaffold deployable mdBook with IA Navy theme and Netlify config |
| `ia-mcp-manifest` | Generate and validate TOML manifests for IA-MCP / amari-mcp servers |

## Install

```bash
# From git (recommended)
pi install git:github.com/Industrial-Algebra/ia-toolkit

# From local path (development)
pi install ./path/to/ia-toolkit
```

## Adding a Skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: What it does and when to use it.
---

# My Skill

...
```

2. That's it. Pi auto-discovers `SKILL.md` directories recursively.

## License

MIT — see [LICENSE](LICENSE).
