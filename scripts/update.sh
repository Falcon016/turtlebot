#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/turtlebot}"
SERVICE_NAME="turtlebot.service"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${APP_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
UPDATED=0

rollback() {
  if [[ "$UPDATED" -eq 1 ]]; then
    echo "[ROLLBACK] restoring previous app dir from $BACKUP_DIR"
    rm -rf "$APP_DIR"
    mv "$BACKUP_DIR" "$APP_DIR"
    systemctl restart "$SERVICE_NAME" || true
  fi
}

trap 'echo "[ERR] update failed"; rollback' ERR

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/update.sh"
  exit 1
fi

bash "$ROOT_DIR/scripts/preflight.sh"

if [[ ! -d "$APP_DIR" ]]; then
  echo "No existing install at $APP_DIR. Use install.sh first."
  exit 1
fi

cp -a "$APP_DIR" "$BACKUP_DIR"
UPDATED=1

rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude workspace \
  "$ROOT_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
npm ci --omit=dev || npm install --omit=dev

install -m 644 "$APP_DIR/scripts/turtlebot.service" "/etc/systemd/system/$SERVICE_NAME"
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"

rm -rf "$BACKUP_DIR"
UPDATED=0

echo "Update complete."
systemctl status "$SERVICE_NAME" --no-pager || true
