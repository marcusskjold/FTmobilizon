#!/bin/bash
act \
  --artifact-server-path "$PWD/.artifacts" \
  --container-options "--volume /git/floortips.git:/git/floortips.git"
