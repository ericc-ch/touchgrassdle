#!/usr/bin/env bash
# Kill only the preview PID started by launch.sh. Evidence survives.
set -uo pipefail
cd "$(dirname "$0")/../../../.."
PID_FILE=.audit/verify.pid
[ -f "$PID_FILE" ] || { echo "nothing to clean"; exit 0; }
PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2> /dev/null; then
  kill "$PID"
  echo "stopped $PID"
else
  echo "pid $PID already gone"
fi
rm -f "$PID_FILE"
ls .audit/evidence/
