#!/usr/bin/env bash
# Read-only readiness check. Never starts or kills anything.
set -uo pipefail
cd "$(dirname "$0")/../../../.."
PID_FILE=.audit/verify.pid
[ -f "$PID_FILE" ] || { echo "no .audit/verify.pid (run launch.sh)"; exit 1; }
PID=$(cat "$PID_FILE")
kill -0 "$PID" 2> /dev/null || { echo "pid $PID not running"; exit 1; }
curl -sf -o /dev/null http://127.0.0.1:4173/ || { echo "port 4173 not answering"; exit 1; }
curl -sI http://127.0.0.1:4173/ | grep -qi "cross-origin" || { echo "COOP/COEP headers missing"; exit 1; }
echo "ready: pid $PID serving 4173 with COOP/COEP"
