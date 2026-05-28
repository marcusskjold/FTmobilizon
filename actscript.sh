#!/bin/bash
set -euo pipefail

# Freeze the version string so the act container builds deterministically
# even if the bare repo's ftdev branch moves later.
git describe --tags --dirty > .build_version 2>/dev/null || true

act \
  --artifact-server-path "$PWD/.artifacts" \
  --container-options "--volume /git/floortips.git:/git/floortips.git"
