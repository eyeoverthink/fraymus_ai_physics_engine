#!/usr/bin/env bash
set -euo pipefail

# Rebuild and verify the renderer-independent core after isolated task changes merge.
mvn --batch-mode --no-transfer-progress clean verify