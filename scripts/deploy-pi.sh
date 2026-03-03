#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/turtlebot"
SERVICE_FILE="turtlebot.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/deploy-pi.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node 20+ first."
  exit 1
fi

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude workspace \
  ./ "$APP_DIR"/

cd "$APP_DIR"
npm ci --omit=dev || npm install --omit=dev

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env (edit before production use)"
fi

install -m 644 "$APP_DIR/scripts/turtlebot.service" "/etc/systemd/system/$SERVICE_FILE"
systemctl daemon-reload
systemctl enable "$SERVICE_FILE"
systemctl restart "$SERVICE_FILE"

systemctl status "$SERVICE_FILE" --no-pager || true
echo "Deploy complete."