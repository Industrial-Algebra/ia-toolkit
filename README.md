# ia-toolkit

Pi package with skills, extensions, and themes for the [Industrial Algebra](https://github.com/Industrial-Algebra) Rust ecosystem.

## Skills

| Skill | Description |
|---|---|
| `ia-coding-standards` | Coding conventions for IA Rust crates — TDD, phantom types, feature gates, error types, docs, Gitflow |
| `ia-release-polish` | Release checklist for IA crates — Cargo.toml, CI, docs, mdBook, README, examples, security |

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
