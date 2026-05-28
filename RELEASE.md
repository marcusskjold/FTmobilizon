# Custom releases

- `ftdev` — your changes (CI workflow, templates, CSS, etc.). Commit and push here.
- `build` — bare repo on the deploy server (`server:/git/floortips.git`). Pushing to it triggers builds.
- Machine 1 and Machine 2 both push to `build`. The server handles the rest.

## Pushing to staging

```bash
git push build ftdev
```

The server hook:
1. Updates `/git/floortips_build` to the new `ftdev` commit
2. Runs `./scripts/stage-deploy.sh` (act build → copy artifact → `ansible-playbook -i inv/staging upgrade.yml`)

## Tagging a release for production

```bash
UPSTREAM=5.2.3
git fetch upstream --tags

git checkout ftdev
git merge --no-edit "$UPSTREAM"
git tag -a "${UPSTREAM}-ft.1" -m "custom release ${UPSTREAM}-ft.1"
git push build ftdev "${UPSTREAM}-ft.1"
```

The hook deploys `ftdev` to staging **and** builds a release artifact.

## Server architecture

```
┌──────────────┐     git push     ┌──────────────────┐
│  Machine 1   │ ───────────────→ │ /git/floortips.git │  bare repo (no files)
│  Machine 2   │                  │  hook: post-receive│
└──────────────┘                  └────────┬─────────┘
                                          │
                              checkout files here
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ /git/floortips_build│  builds happen here
                                │  never touched   │  (machine only)
                                └──────────────────┘
```

If you need to edit on the server, use `/develop/FTrepo`, commit there, and push to the bare repo. The hook then updates the build directory.

## If a merge conflicts

```bash
git checkout ftdev
git merge "$UPSTREAM"
# resolve files...
git add -A
git merge --continue
git tag -a "${UPSTREAM}-ft.1" -m "custom release ${UPSTREAM}-ft.1"
git push build ftdev "${UPSTREAM}-ft.1"
```

## Server setup (run once on server)

```bash
# 1. Create bare repo
git init --bare /git/floortips.git

# 2. Add linked worktree for ftdev branch (this is a proper checkout, not a dump)
cd /git/floortips.git
git worktree add /git/floortips_build ftdev

# 3. Install hook
cp /wherever/server/post-receive /git/floortips.git/hooks/post-receive
chmod +x /git/floortips.git/hooks/post-receive
```

Now `/git/floortips_build` is a normal git checkout with a `.git` file.
`act`, `git status`, etc. all work inside it. The hook updates it automatically.

```bash
git remote add build server:/git/floortips.git
```
