#!/usr/bin/env bash
# install-blender-skills.sh — fetch arjun988/blender-skills and copy its
# .claude/skills/* into ~/.pi/agent/skills/blender-skills/.
#
# No transformation needed: upstream skills are already Agent-Skills-compliant
# (name/description/metadata frontmatter, no $ARGUMENTS). Copied verbatim so the
# internal blender-director -> specialist routing (which uses skill names) keeps
# working. A shared references/ dir (no SKILL.md) travels along as assets.
# Idempotent: re-running replaces the target with the latest upstream.
set -euo pipefail

DST="${1:-$HOME/.pi/agent/skills/blender-skills}"
UPSTREAM="${BLENDER_SKILLS_REPO:-https://github.com/arjun988/blender-skills}"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
git clone --depth 1 --quiet "$UPSTREAM" "$tmp/src"
src="$tmp/src/.claude/skills"
[ -d "$src" ] || { echo "ERROR: $src not found upstream (layout changed?)" >&2; exit 1; }

# Replace target wholesale so deleted/renamed upstream skills don't linger.
mkdir -p "$(dirname "$DST")"
rm -rf "$DST"
cp -r "$src" "$DST"

n="$(find "$DST" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')"
sha="$(git -C "$tmp/src" rev-parse --short HEAD)"

cat > "$DST/README.md" <<EOF
# Blender Skills (pi)

Refreshed verbatim from [$UPSTREAM]($UPSTREAM) \`.claude/skills/\` by \`ia-media-setup\`.
No transformation — upstream is already Agent-Skills-compliant. Skill names are
preserved because \`blender-director\` routes to the others by name. Upstream
license: MIT (© arjun988). Drives a live Blender via ahujasid/blender-mcp (MIT).
EOF

echo "Installed/refreshed $n blender skills into $DST (from $sha)"
