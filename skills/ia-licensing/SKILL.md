---
name: ia-licensing
description: Industrial Algebra's licensing model. Use when creating a new IA crate, choosing a license, writing CONTRIBUTING/CLA references, or when a skill or doc references the IA license. The IA ecosystem standard is Apache-2.0 + CLA. Hardware and strategic repos (Kagome, and future repos designated by Justin) retain AGPL-3.0-only. Do NOT relicense AGPL repos without explicit direction.
---

# IA Licensing

## Overview

Industrial Algebra projects use **Apache-2.0** with a **Contributor License
Agreement (CLA)** as the ecosystem standard. This replaced the earlier
AGPL-3.0-only model for most projects in June 2026.

**Important:** Not all projects use Apache-2.0. Some repos are intentionally
AGPL and must NOT be relicensed without explicit direction from Justin. See the
exceptions section below.

## Why Apache-2.0 (Default)

The AGPL's network-use clause (Section 13) creates adoption barriers — most
enterprise legal departments blanket-ban AGPL software, excluding exactly the
customers IA targets for libraries and infrastructure. Apache-2.0 maximizes
adoption while preserving attribution and patent grants.

## The License Stack

| Layer | License | Purpose |
|---|---|---|
| Public projects | **Apache-2.0** | Maximum adoption; attribution; patent grant |
| CLA | [CLA.md](https://github.com/Industrial-Algebra/.github/blob/main/CLA.md) | Grants IA the right to relicense contributions commercially |
| AGPL-strategic repos | **AGPL-3.0-only** + commercial dual-license | Hardware specs, physical compute architectures, competitive moats |
| Fully proprietary repos | Proprietary (not public) | Not released |

### Exceptions

**AGPL-3.0-only (intentionally retained — do NOT relicense):**

- **Kagome** — Microwave-optical hardware design. The kagome lattice is a
  physical manufactured artifact; the software describes how to build a
  10,000,000× more energy-efficient compute substrate. AGPL prevents
  enterprises from building cloud optical inference services on this design
  without contributing back or negotiating a commercial license. Has
  LICENSE-COMMERCIAL for dual-licensing.

- **Other repos as designated by Justin** — Some future repos may be AGPL if
  they encode hardware designs, manufacturing specifications, or physical
  compute architectures where the software IS the competitive moat. Justin
  will designate these explicitly. When encountering an AGPL repo not listed
  here, ask before touching the license.

**Proprietary (not public):**

- **Minoru** — Theorem mining engine. Proprietary; if released in some form,
  license will be determined at that time.

**Maximally permissive:**

- **Amari** — Always MIT (the foundational math library; maximally permissive).
  This is the mathematical substrate the entire ecosystem depends on.

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

**⚠️ Do not relicense without explicit direction from Justin.** Some repos
are AGPL by design (see exceptions). Only relicense repos that are explicitly
flagged for migration.

When a repo IS flagged for migration:

1. Verify with Justin that this specific repo should be relicensed.
2. Replace LICENSE with Apache-2.0 text.
3. Delete LICENSE-COMMERCIAL (if present).
4. `Cargo.toml`: `license = "AGPL-3.0-only"` → `license = "Apache-2.0"`.
5. All source headers: `SPDX-License-Identifier: AGPL-3.0-only` → `Apache-2.0`.
6. Update README, CONTRIBUTING, book, CHANGELOG.
7. Bump version (the published AGPL version stays on crates.io permanently;
   the new version carries Apache-2.0).

Published AGPL versions on crates.io cannot be changed — the new version
carries the new license. This is normal and expected.

## When AGPL Is Correct (Not an Anti-Pattern)

AGPL is the right license when:

1. **The repo describes hardware.** If the primary artifact is a physical
   manufactured object (3D-printed parts, ASIC layouts, resonator arrays),
   the "software" is really a hardware specification. AGPL's network clause
   prevents cloud providers from operating the hardware design as a service
   without contributing back.

2. **The repo IS the moat.** If the competitive advantage lives in the
   software itself — not in data, not in models, not in brand — then
   permissive licensing gives away the moat. AGPL preserves it.

3. **Dual-licensing is the business model.** AGPL + LICENSE-COMMERCIAL is a
   proven model for monetizing open-source infrastructure (MongoDB, Redis,
   GitLab). The AGPL version is free for research, community, and
   non-commercial use; the commercial license is for enterprises that want
   to build closed products on it.

When in doubt, ask Justin. Do not assume AGPL is a mistake to be fixed.

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
own critique panels) that AGPL creates enterprise adoption barriers for
libraries and infrastructure. AGPL is retained for hardware and strategic
repos where the software is the competitive moat.
