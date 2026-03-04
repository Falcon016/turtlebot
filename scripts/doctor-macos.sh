#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.falcon016.turtlebot"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$ROOT_DIR/workspace/logs"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS only."
  exit 1
fi

echo "== TurtleBot macOS doctor =="
if [[ -f "$PLIST_PATH" ]]; then
  echo "[OK] plist present: $PLIST_PATH"
else
  echo "[WARN] plist missing: $PLIST_PATH"
fi

if launchctl print "gui/$(id -u)/${LABEL}" >/dev/null 2>&1; then
  echo "[OK] launchd service loaded: ${LABEL}"
else
  echo "[WARN] launchd service not loaded: ${LABEL}"
fi

if [[ -f "$LOG_DIR/turtlebot.out.log" ]]; then
  echo "[OK] stdout log: $LOG_DIR/turtlebot.out.log"
else
  echo "[WARN] stdout log not found yet"
fi

if [[ -f "$LOG_DIR/turtlebot.err.log" ]]; then
  echo "[OK] stderr log: $LOG_DIR/turtlebot.err.log"
else
  echo "[WARN] stderr log not found yet"
fi
