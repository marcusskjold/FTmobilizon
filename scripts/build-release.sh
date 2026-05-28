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

echo "==> Copying release artifact..."
mkdir -p "${DEPLOY_DIR}/releases"
cp .artifacts/mobilizon-*.tar.gz "${DEPLOY_DIR}/releases/"

echo "==> Release built: ${DEPLOY_DIR}/releases/mobilizon-${TAG}.tar.gz"
