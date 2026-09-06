#!/usr/bin/env bash
set -euo pipefail

# Restore workspace packages and apply the scaffold's development schema check.
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push

# Rebuild and verify the preserved renderer-independent Java core.
mvn --batch-mode --no-transfer-progress clean verify