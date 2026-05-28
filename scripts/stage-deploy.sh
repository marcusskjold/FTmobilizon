#!/usr/bin/env bash
set -euo pipefail

# stage-deploy.sh — build ftdev via act and deploy to staging.
# Runs on the server inside /git/floortips_build.

BUILD_DIR="/git/floortips_build"
DEPLOY_DIR="/develop/FTdeploy"

cd "$BUILD_DIR"

echo "==> Running act build..."
./actscript.sh

echo "==> Extracting artifact..."
mkdir -p "${DEPLOY_DIR}/releases"
FREEZER_DIR="/freezer/2/FT/builds"
mkdir -p "${FREEZER_DIR}"

# act stores uploaded artifacts under .artifacts/{run}/{name}/{name}.zip
ZIP=$(find .artifacts -name 'mobilizon-release.zip' -type f | sort | tail -1)
if [ -z "$ZIP" ]; then
  echo "ERROR: no mobilizon-release.zip found in .artifacts/"
  exit 1
fi

# The zip contains the .tar.gz release — extract it directly
unzip -j -o "$ZIP" -d "${DEPLOY_DIR}/releases/"
echo "==> Extracted $(ls "${DEPLOY_DIR}/releases/"/*.tar.gz)"

# Copy the zip itself — the Ansible playbook stats this file for updates
cp "$ZIP" "${DEPLOY_DIR}/releases/mobilizon-release.zip"

# Archive the build in the freezer for rollback / production selection
TARBALL=$(ls -t "${DEPLOY_DIR}/releases/"/*.tar.gz | head -1)
cp "$TARBALL" "${FREEZER_DIR}/"
ln -sf "$(basename "$TARBALL")" "${FREEZER_DIR}/latest.tar.gz"
echo "==> Build archived to ${FREEZER_DIR}/$(basename "$TARBALL")"

echo "==> Deploying to staging..."
cd "$DEPLOY_DIR"
ansible-playbook -i inv/staging.yml upgrade.yml

echo "==> Staging deploy complete."
