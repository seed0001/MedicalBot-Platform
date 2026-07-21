# Contributing

Two people work on this repo. Follow this workflow so nothing gets lost.

## Before you start

```bash
git checkout main
git pull --rebase origin main
```

Do this every time you sit down to work — even if you think you're up to date.

## While you work

Use a **feature branch** for anything more than a one-line fix:

```bash
git checkout -b yourname/short-topic
# ... edit, commit ...
git push -u origin HEAD
```

Open a pull request on GitHub and merge to `main` when checks pass (or after the other person reviews).

**Branch naming:** `yourname/topic` — e.g. `pfaus/product-descriptions`, `travis/assistant-tools`.

## Before you push

```bash
git fetch origin
git pull --rebase origin main   # on your branch, replay your commits on latest main
git push
```

If you're on `main` directly (small fixes only):

```bash
git pull --rebase origin main
git push origin main
```

**Never** `git push --force` to `main`.

## After you pull

If `packages/shared` or `packages/conditions` changed:

```bash
npm install
npm run build --workspace @medbot/shared
npm run build --workspace @medbot/conditions
```

If the database schema changed:

```bash
npm run db:migrate
```

## Avoiding conflicts

| Area | Who to coordinate with |
|------|------------------------|
| `packages/shared/` | Anyone — rebuild required after pull |
| `apps/api/src/db/schema.ts` | Coordinate migrations; don't edit the same migration file |
| `apps/web/` | Usually safe in parallel; watch `HomeClient`, `layout`, shared components |
| `docs/` | Safe in parallel; merge conflicts are rare |

If you both touch the same file, **talk first** or split the work by file.

## Merge checklist

Before merging a PR (or pushing to `main`):

- [ ] `git pull --rebase origin main` — no conflicts
- [ ] `npm run build --workspace @medbot/shared` (if shared changed)
- [ ] App starts locally (`npm run dev:api` + `npm run dev:web`)
- [ ] No secrets in the commit (`.env`, API keys)

## Quick reference

| Situation | Command |
|-----------|---------|
| Start of day | `git pull --rebase origin main` |
| Save work | `git add … && git commit -m "…"` |
| Update branch | `git pull --rebase origin main` |
| Ship | Push branch → PR → merge, or push `main` for tiny fixes |
| See what's on remote | `git fetch origin && git log HEAD..origin/main --oneline` |
| Stash before pull | `git stash && git pull --rebase origin main && git stash pop` |

## Remote branches

Stale feature branches can be deleted after merge:

```bash
git branch -d yourname/topic
git push origin --delete yourname/topic
```
