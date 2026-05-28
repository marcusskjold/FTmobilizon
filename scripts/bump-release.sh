#!/usr/bin/env bash
set -euo pipefail

# bump-release.sh — merge an upstream release tag into ftdev and tag the result.
#
# Usage: ./scripts/bump-release.sh 5.2.3

UPSTREAM_TAG="${1:-}"
CUSTOM_SUFFIX="${2:-ft.1}"

if [ -z "$UPSTREAM_TAG" ]; then
  echo "Usage: $0 <upstream-tag>"
  echo ""
  echo "Recent upstream tags:"
  git tag -l --sort=-v:refname | head -10
  exit 1
fi

CUSTOM_TAG="${UPSTREAM_TAG}-${CUSTOM_SUFFIX}"

echo "== Fetching upstream tags..."
git fetch upstream --tags

echo "== Merging ${UPSTREAM_TAG} into ftdev..."
git checkout ftdev
git merge --no-edit "${UPSTREAM_TAG}"

echo "== Tagging ${CUSTOM_TAG}..."
git tag -a "${CUSTOM_TAG}" -m "Custom release ${CUSTOM_TAG}"

echo "== Pushing ftdev + tag..."
git push origin ftdev "${CUSTOM_TAG}"

echo ""
echo "Done. To build: ./scripts/build-on-server.sh ${CUSTOM_TAG}"
