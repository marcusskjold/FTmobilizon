# Custom releases

- `ftdev` — your changes (CI workflow, templates, CSS, etc.). Commit and push here.
- Machine 1 (Mac) pushes to GitHub (`origin`).
- The build server pulls from GitHub and runs builds manually.

## Toolchain

Versions come from `.tool-versions` (asdf format), which is **upstream-owned**:
`erlang 28.5.0.3`, `elixir 1.18.4`, `nodejs 24.18.0` at the time of writing.

The workflow reads that file directly (`version-file` / `node-version-file`), so
merging upstream moves the compiler along with the code. **Never pin
`otp-version`, `elixir-version` or `node-version` in `release.yml` again** — that
is how the build silently rots behind the app's requirements.

`mix.exs` enforces Elixir (`elixir: "~> 1.17"`), but nothing enforces OTP, and
hackney 4 needs OTP 27+. The `Verify toolchain` step prints the three versions
and fails the build if OTP is too old.

## Pushing to staging

```bash
# On your Mac
git push origin ftdev

# On the build server
ssh server
cd /develop/FT/buildscripts
./ft-deploy-staging.sh --pull
```

`/develop/FT/buildscripts/ft-deploy-staging.sh`:
1. `--pull` resets `/develop/FT/repo` to `origin/ftdev`
2. Runs `act` to build the release inside Docker (versions from `.tool-versions`)
3. Extracts the tarball to `/freezer/2/FT/builds/` and updates `latest.tar.gz`
4. Runs `ansible-playbook -i inv/staging.yml upgrade.yml` with that tarball

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
cd /develop/FT/buildscripts
./ft-build-release.sh "${UPSTREAM}-ft.1"
```

That checks out the tag, runs `act`, and archives the artifact in the freezer.

### Deploy to production

```bash
# On the build server
cd /develop/FT/deploy
ansible-playbook -i inv/production.yml upgrade.yml \
  -e "mobilizon_release_tarball=/freezer/2/FT/builds/mobilizon-${UPSTREAM}-ft.1.tar.gz"
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
                                │  /develop/FT/repo  │  manual checkout
                                │  (builds here)     │  on build server
                                └─────────┬──────────┘
                                          │
                        act build → ┌─────┴─────────┐
                                    │  /freezer/…  │  rollback archive
                                    │  /FT/deploy/ │  ansible deploy
                                    └──────────────┘
```

## Server setup (run once on server)

```bash
# 1. Clone the repo
git clone git@github.com:marcusskjold/FTmobilizon.git /develop/FT/repo
cd /develop/FT/repo
git checkout ftdev

# 2. Ensure act is available
# (already installed via linuxbrew)
```

No hook, no bare repo, no worktree. Everything is manual.
