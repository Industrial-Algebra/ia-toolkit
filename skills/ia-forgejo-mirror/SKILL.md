---
name: ia-forgejo-mirror
description: Set up dual-push mirroring from GitHub to the IA private Forgejo server (king-ghidorah) on a client machine. Covers the working HTTPS+token recipe (SSH key auth does NOT work through this Forgejo — do not pursue it), per-machine credential store, creating the Forgejo repo via API (a missing repo returns HTTP 403, not 404), and wiring `origin` to push to both remotes. Use when onboarding a new machine or a new repo to the Forgejo mirror, or when a Forgejo push fails with "Permission denied (publickey)" or HTTP 403. Repeatable across machines.
---

# IA Forgejo Mirror (king-ghidorah)

## Overview

Industrial Algebra mirrors every repo from GitHub (primary) to a private
**Forgejo** server on `king-ghidorah.tail0311a1.ts.net` (Tailscale
`100.80.244.52`) for redundancy. Forgejo serves both a web UI and git over
HTTPS; all IA repos live under the `industrial-algebra` org and are **private**.

**The single most important fact:** SSH key auth does **not** work through this
Forgejo. It accepts the TCP/SSH connection on port 22 but rejects every key
(the general `id_ed25519`, a dedicated `id_ghidorah`, all users) — even via
ProxyJump from another trusted host. This was confirmed across rindler and
norma-wall. **Do not spend time on SSH keys.** The reliable path, discovered on
norma-wall, is **HTTPS + a personal access token**.

## When to Use

- Onboarding a new client machine to push to Forgejo (the `FORGEJO_TOKEN`
  credential-store setup is once per machine).
- Mirroring a new repo to Forgejo (create it via the API first, then push).
- A Forgejo push fails with `Permission denied (publickey)` → you are on the SSH
  path; switch to HTTPS.
- A Forgejo push fails with `HTTP 403` / "requested URL returned error: 403" →
  the repo does not exist on Forgejo yet (Forgejo returns 403, not 404, for a
  missing repo). Create it, then push.
- User says "set up the forgejo mirror" / "dual-push to king-ghidorah".

## Prerequisites

- The machine is on the Tailscale tailnet:
  ```sh
  tailscale status | grep king-ghidorah   # must list king-ghidorah
  ```
- `git`, `curl` installed.
- The Forgejo token (see **Secrets** below).

## Secrets

The Forgejo account is **`lucien`** (admin; full name Justin Elliott Cobb), with
a personal access token that has **full read/write on all repos under
`industrial-algebra`**.

**Never commit the token.** Reference it as `$FORGEJO_TOKEN`:
- Set it in the shell for the session, OR
- Retrieve it from agent memory: `memory_search("forgejo king-ghidorah token")`
  (stored under the `forgejo-king-ghidorah-https-token-recipe` topic), OR
- Ask Justin.

The Forgejo web API is auth-gated (`REQUIRE_SIGNIN_VIEW` is on — "Only signed in
user is allowed to call APIs"), so **every** `curl` needs
`-H "Authorization: token $FORGEJO_TOKEN"`.

## Setup — once per client machine

Store the token in the git credential helper (the token lives only in
`~/.git-credentials`, never in a remote URL or `.git/config`):

```sh
echo "https://lucien:${FORGEJO_TOKEN}@king-ghidorah.tail0311a1.ts.net" >> ~/.git-credentials
chmod 600 ~/.git-credentials
git config --global credential.helper store
```

## Per-repo setup

For each repo to mirror, **in the repo's working directory**:

### 1. Create the repo on Forgejo (if it doesn't exist)

Check first, then create (private, `default_branch=main`):

```sh
HOST=king-ghidorah.tail0311a1.ts.net
REPO=<Repo>           # e.g. Kagome — case-insensitive, matches GitHub name
# exists?
curl -sk -H "Authorization: token $FORGEJO_TOKEN" \
  "https://$HOST/api/v1/repos/industrial-algebra/$REPO" | grep -o '"full_name"'
# create if missing (HTTP 403 on push = missing):
curl -sk -X POST -H "Authorization: token $FORGEJO_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO\",\"private\":true,\"default_branch\":\"main\"}" \
  "https://$HOST/api/v1/orgs/industrial-algebra/repos" | grep -o '"full_name"'
```

### 2. Add the Forgejo remote (HTTPS)

```sh
git remote add king-ghidorah "https://$HOST/industrial-algebra/$REPO.git"
```

### 3. Wire dual-push on `origin` (push to GitHub + Forgejo in one command)

```sh
FJ="https://$HOST/industrial-algebra/$REPO.git"
git remote set-url --add --push origin "$FJ"   # alongside the existing GitHub pushurl
```

After this, `git push` hits **both** remotes: GitHub (its existing SSH/HTTPS
pushurl) and Forgejo (the HTTPS pushurl, authenticated via the credential store).

> Note: `git remote set-url --add --push` the first time *replaces* the implicit
> fetch-url-as-pushurl with an explicit list, so if `origin` had no explicit
> pushurl, add the GitHub URL too:
> `git remote set-url --push origin <github-url>` then `--add --push origin "$FJ"`.

### 4. Push

```sh
git push king-ghidorah main   # explicit mirror (first time)
git push origin main          # dual-push thereafter (GitHub + Forgejo)
```

## Verification

- Auth works:
  `curl -sk -H "Authorization: token $FORGEJO_TOKEN" https://$HOST/api/v1/user`
  → returns the `lucien` user JSON.
- Push landed:
  ```sh
  curl -sk -H "Authorization: token $FORGEJO_TOKEN" \
    "https://$HOST/api/v1/repos/industrial-algebra/$REPO/commits?limit=1" | grep -o '"sha":"[0-9a-f]*"'
  ```
  should match the local `git rev-parse HEAD`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Permission denied (publickey)` | On the SSH path | Switch to HTTPS — SSH key auth never works here |
| HTTP `403` on push / "requested URL returned error: 403" | Repo doesn't exist on Forgejo | Create it via the API (step 1), then push |
| API returns "Only signed in user is allowed to call APIs" | Missing/invalid token header | Add `-H "Authorization: token $FORGEJO_TOKEN"` |
| `fatal: Authentication failed` | Token wrong/expired, or username not `lucien` | Re-store credentials; verify token via `/api/v1/user` |
| GitHub push still goes through but Forgejo leg silently skipped | Credential helper not set globally | `git config --global credential.helper store` |

## Reference

- **Forgejo host:** `king-ghidorah.tail0311a1.ts.net` (Tailscale `100.80.244.52`)
- **Web/API base:** `https://king-ghidorah.tail0311a1.ts.net`
- **Account:** `lucien` (admin)
- **Org:** `industrial-algebra` (all repos private)
- **API auth:** `Authorization: token $FORGEJO_TOKEN` on every call
- **norma-wall shell access** (unrelated to Forgejo, for reference):
  `elliotthall@norma-wall.tail0311a1.ts.net` with the general `id_ed25519`

## Machine-local caveat

The credential store (`~/.git-credentials`), `credential.helper` config, and any
remote/pushurl changes are **machine-local** — they are not in any repo and do
**not** replicate via `git clone`. Repeat this setup on each client machine.
