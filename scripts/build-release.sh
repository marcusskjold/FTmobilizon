#!/usr/bin/env bash
set -euo pipefail

# build-release.sh — build a tagged release via act and save the artifact.
# Runs on the server inside /develop/FTrepo.

TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

BUILD_DIR="/develop/FTrepo"
DEPLOY_DIR="/develop/FTdeploy"

cd "$BUILD_DIR"

echo "==> Fetching tag ${TAG}..."
git fetch origin tag "${TAG}"

echo "==> Checking out tag ${TAG}..."
git checkout -f "$TAG"

echo "==> Running act build for ${TAG}..."
./actscript.sh

echo "==> Extracting artifact..."
mkdir -p "${DEPLOY_DIR}/releases"

# act stores uploaded artifacts under .artifacts/{run}/{name}/{name}.zip
ZIP=$(find .artifacts -name 'mobilizon-release.zip' -type f | sort | tail -1)
if [ -z "$ZIP" ]; then
  echo "ERROR: no mobilizon-release.zip found in .artifacts/"
  exit 1
fi

unzip -j -o "$ZIP" -d "${DEPLOY_DIR}/releases/"
cp "$ZIP" "${DEPLOY_DIR}/releases/mobilizon-release.zip"

# Archive the build in the freezer for rollback / production selection
FREEZER_DIR="/freezer/2/FT/builds"
mkdir -p "${FREEZER_DIR}"
TARBALL=$(ls -t "${DEPLOY_DIR}/releases/"/*.tar.gz | head -1)
cp "$TARBALL" "${FREEZER_DIR}/"
ln -sf "$(basename "$TARBALL")" "${FREEZER_DIR}/latest.tar.gz"
echo "==> Release built and archived:"
ls -la "${DEPLOY_DIR}/releases/"/*.tar.gz
echo "==> Freezer:"
ls -la "${FREEZER_DIR}/"*.tar.gz
ls -la "${FREEZER_DIR}/latest.tar.gz"
