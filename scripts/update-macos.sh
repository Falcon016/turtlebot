#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.falcon016.turtlebot"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS only."
  exit 1
fi

cd "$ROOT_DIR"
npm ci --omit=dev || npm install --omit=dev
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

echo "Updated dependencies and restarted ${LABEL}."
