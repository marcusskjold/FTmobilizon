#!/usr/bin/env bash
set -euo pipefail

# stage-deploy.sh — build ftdev via act and deploy to staging.
# Runs on the server inside /git/floortips_build.

BUILD_DIR="/git/floortips_build"
DEPLOY_DIR="/develop/FTdeploy"

cd "$BUILD_DIR"

echo "==> Running act build..."
./actscript.sh

echo "==> Copying release artifact..."
mkdir -p "${DEPLOY_DIR}/releases"
cp .artifacts/mobilizon-*.tar.gz "${DEPLOY_DIR}/releases/"

echo "==> Deploying to staging..."
cd "$DEPLOY_DIR"
ansible-playbook -i inv/staging upgrade.yml

echo "==> Staging deploy complete."
