#!/usr/bin/env bash
# Build + start preview for verification. Saves PID to .audit/verify.pid.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
mkdir -p .audit/evidence
pnpm build > /dev/null
nohup pnpm preview --host 127.0.0.1 --port 4173 --strictPort > .audit/preview.log 2>&1 &
echo $! > .audit/verify.pid
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null http://127.0.0.1:4173/; then
    echo "preview up (pid $(cat .audit/verify.pid))"
    exit 0
  fi
  sleep 1
done
echo "preview failed to start; see .audit/preview.log"
exit 1
