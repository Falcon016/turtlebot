#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/turtlebot}"
SERVICE_NAME="turtlebot.service"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1"; exit 1; }; }

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/install.sh"
  exit 1
fi

need_cmd rsync
need_cmd systemctl
need_cmd node
need_cmd npm

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Node 20+ required. Found: $(node -v)"
  exit 1
fi

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude workspace \
  "$ROOT_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
npm ci --omit=dev || npm install --omit=dev

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env (edit this before production use)."
fi

install -m 644 "$APP_DIR/scripts/turtlebot.service" "/etc/systemd/system/$SERVICE_NAME"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo "Install complete."
systemctl status "$SERVICE_NAME" --no-pager || true
