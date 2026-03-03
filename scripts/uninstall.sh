#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/turtlebot}"
SERVICE_NAME="turtlebot.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/uninstall.sh"
  exit 1
fi

if systemctl list-unit-files | grep -q "^${SERVICE_NAME}"; then
  systemctl stop "$SERVICE_NAME" || true
  systemctl disable "$SERVICE_NAME" || true
fi

rm -f "/etc/systemd/system/$SERVICE_NAME"
systemctl daemon-reload

if [[ -d "$APP_DIR" ]]; then
  rm -rf "$APP_DIR"
fi

echo "Uninstall complete."
