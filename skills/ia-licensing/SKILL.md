---
name: ia-licensing
description: Industrial Algebra's licensing model. Use when creating a new IA crate, choosing a license, writing CONTRIBUTING/CLA references, or when a skill or doc references the IA license. The IA ecosystem uses Apache-2.0 + CLA (not AGPL).
---

# IA Licensing

## Overview

Industrial Algebra projects use **Apache-2.0** with a **Contributor License
Agreement (CLA)**. This replaced the earlier AGPL-3.0-only model in June 2026.

## Why Apache-2.0 (Not AGPL)

The AGPL's network-use clause (Section 13) created adoption barriers — most
enterprise legal departments blanket-ban AGPL software, excluding exactly the
customers IA targets. Apache-2.0 maximizes adoption while preserving
attribution and patent grants.

## The License Stack

| Layer | License | Purpose |
|---|---|---|
| Public projects | **Apache-2.0** | Maximum adoption; attribution; patent grant |
| CLA | [CLA.md](https://github.com/Industrial-Algebra/.github/blob/main/CLA.md) | Grants IA the right to relicense contributions commercially |
| Fully proprietary repos (Minoru, Mishima) | Proprietary (not public) | Not released |

### Exceptions

- **Amari**: always MIT (the foundational math library; maximally permissive).
- **Proprietary repos**: Minoru, Mishima, and others as designated by Justin.

## Applying the License to a New Crate

### Cargo.toml

```toml
license = "Apache-2.0"
```

### LICENSE file

The Apache-2.0 full text: `https://www.apache.org/licenses/LICENSE-2.0.txt`

### Source file headers

Every `.rs` file:

```rust
// Copyright (C) 2026 Industrial Algebra
// SPDX-License-Identifier: Apache-2.0
```

### CONTRIBUTING.md

Reference the CLA:

```markdown
All contributors must sign the [CLA](https://github.com/Industrial-Algebra/.github/blob/main/CLA.md).
```

### No LICENSE-COMMERCIAL file

Apache-2.0 permits commercial use directly. No dual-license or
LICENSE-COMMERCIAL file is needed.

## Relicensing an Existing AGPL Crate

1. Replace LICENSE with Apache-2.0 text.
2. Delete LICENSE-COMMERCIAL (if present).
3. `Cargo.toml`: `license = "AGPL-3.0-only"` → `license = "Apache-2.0"`.
4. All source headers: `SPDX-License-Identifier: AGPL-3.0-only` → `Apache-2.0`.
5. Update README, CONTRIBUTING, book, CHANGELOG.
6. Bump version (the published AGPL version stays on crates.io permanently;
   the new version carries Apache-2.0).

Published AGPL versions on crates.io cannot be changed — the new version
carries the new license. This is normal and expected.

## The CLA

The CLA is at [github.com/Industrial-Algebra/.github/blob/main/CLA.md](https://github.com/Industrial-Algebra/.github/blob/main/CLA.md).

Key provisions:
- Copyright grant (non-exclusive, worldwide, royalty-free, irrevocable)
- Right to relicense: IA may distribute contributions under any license
- Patent grant with retaliation clause
- Covers all IA projects once signed (no per-project signing)

## Historical Note

Prior to June 2026, IA projects used AGPL-3.0-only + dual-commercial-licensing.
The migration to Apache-2.0 was prompted by the discovery (via Proserpina's
own critique panels) that AGPL creates enterprise adoption barriers.
