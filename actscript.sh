#!/bin/bash
set -euo pipefail

# Freeze the version string so the act container builds deterministically
git describe --tags --dirty > .build_version 2>/dev/null || true

act \
  --artifact-server-path "$PWD/.artifacts"
