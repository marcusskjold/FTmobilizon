#!/usr/bin/env bash
set -euo pipefail

# build-release.sh — build a tagged release via act and save the artifact.
# Runs on the server inside /git/floortips_build.

TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

BUILD_DIR="/git/floortips_build"
DEPLOY_DIR="/develop/FTdeploy"

cd "$BUILD_DIR"

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
echo "==> Release built and saved:"
ls -la "${DEPLOY_DIR}/releases/"/*.tar.gz
