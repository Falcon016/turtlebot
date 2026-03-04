#!/usr/bin/env bash
set -euo pipefail

LABEL="com.falcon016.turtlebot"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS only."
  exit 1
fi

launchctl bootout "gui/$(id -u)/${LABEL}" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"

echo "Uninstalled macOS service: ${LABEL}"
