#!/bin/bash
set -euo pipefail

act \
  --artifact-server-path "$PWD/.artifacts"
