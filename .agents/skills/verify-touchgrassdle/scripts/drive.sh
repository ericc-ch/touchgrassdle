#!/usr/bin/env bash
# Drive one graduated workflow. Usage: drive.sh [boot|guess|day-end|theme|model-error]
set -euo pipefail
cd "$(dirname "$0")/../../../.."
if [ -z "${E2E_BROWSER:-}" ] && command -v helium > /dev/null; then
  export E2E_BROWSER="$(command -v helium)"
fi
SPEC="${1:-guess}"
mkdir -p .audit/evidence
pnpm exec playwright test "tests/e2e/${SPEC}.spec.ts" --reporter=line 2>&1 | tee ".audit/evidence/drive-${SPEC}.log"
