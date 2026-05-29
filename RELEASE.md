# Custom releases

- `ftdev` — your changes (CI workflow, templates, CSS, etc.). Commit and push here.
- Machine 1 (Mac) pushes to GitHub (`origin`).
- The build server pulls from GitHub and runs builds manually.

## Pushing to staging

```bash
# On your Mac
git push origin ftdev

# On the build server
ssh server
cd /develop/FTrepo
git fetch origin
git reset --hard origin/ftdev
./scripts/stage-deploy.sh
```

`stage-deploy.sh`:
1. Freezes the version string (`git describe --tags --dirty > .build_version`)
2. Runs `act` to compile the release inside Docker
3. Extracts the tarball to `/develop/FTdeploy/releases/`
4. Archives it in `/freezer/2/FT/builds/`
5. Runs `ansible-playbook -i inv/staging.yml upgrade.yml`

## Tagging a release for production

```bash
# On your Mac
UPSTREAM=5.2.3
git fetch upstream --tags

git checkout ftdev
git merge --no-edit "$UPSTREAM"
git tag -a "${UPSTREAM}-ft.1" -m "custom release ${UPSTREAM}-ft.1"
git push origin ftdev "${UPSTREAM}-ft.1"
```

Then on the build server:

```bash
ssh server
cd /develop/FTrepo
./scripts/build-release.sh "${UPSTREAM}-ft.1"
```

That checks out the tag, freezes the version, runs `act`, and archives the artifact in the freezer.

### Deploy to production

```bash
# On Machine 2 or the build server
cd /develop/FTdeploy
ansible-playbook -i inv/production.yml site.yml
```

## Server architecture

```
┌──────────────┐      git push      ┌────────────────────┐
│  Machine 1   │ ────────────────→ │  GitHub (origin)   │
│  Machine 2   │                  └─────────┬──────────┘
└──────────────┘                            │
                                          │  git pull / fetch
                                          ▼
                                ┌────────────────────┐
                                │  /develop/FTrepo   │  manual checkout
                                │  (builds here)     │  on build server
                                └─────────┬──────────┘
                                          │
                        act build → ┌─────┴───────┐
                                    │  /freezer/…  │  rollback archive
                                    │  /FTdeploy/  │  ansible deploy
                                    └──────────────┘
```

## Server setup (run once on server)

```bash
# 1. Clone the repo
git clone git@github.com:marcusskjold/FTmobilizon.git /develop/FTrepo
cd /develop/FTrepo
git checkout ftdev

# 2. Ensure act is available
# (already installed via linuxbrew)
```

No hook, no bare repo, no worktree. Everything is manual.
