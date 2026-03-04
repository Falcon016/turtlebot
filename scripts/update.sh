#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/turtlebot}"
SERVICE_NAME="turtlebot.service"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="${SOURCE_DIR:-$ROOT_DIR}"
DRY_RUN="${TB_UPDATE_DRY_RUN:-false}"
BACKUP_DIR="${APP_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
UPDATED=0

do_service() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY_RUN] $*"
    return 0
  fi
  "$@"
}

rollback() {
  if [[ "$UPDATED" -eq 1 ]]; then
    echo "[ROLLBACK] restoring previous app dir from $BACKUP_DIR"
    rm -rf "$APP_DIR"
    mv "$BACKUP_DIR" "$APP_DIR"
    do_service systemctl restart "$SERVICE_NAME" || true
  fi
}

trap 'echo "[ERR] update failed"; rollback' ERR

if [[ "$DRY_RUN" != "true" && "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/update.sh"
  exit 1
fi

bash "$ROOT_DIR/scripts/preflight.sh"

if [[ ! -d "$APP_DIR" ]]; then
  echo "No existing install at $APP_DIR. Use install.sh first."
  exit 1
fi

if [[ -d "$SOURCE_DIR/.git" ]]; then
  echo "Refreshing source from git in $SOURCE_DIR ..."
  git -C "$SOURCE_DIR" fetch origin || true
  BRANCH="$(git -C "$SOURCE_DIR" rev-parse --abbrev-ref HEAD || echo "")"
  if [[ -n "$BRANCH" && "$BRANCH" != "HEAD" ]]; then
    git -C "$SOURCE_DIR" pull --ff-only origin "$BRANCH" || true
  fi
else
  echo "[WARN] SOURCE_DIR is not a git repo: $SOURCE_DIR"
fi

cp -a "$APP_DIR" "$BACKUP_DIR"
UPDATED=1

rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude workspace \
  "$SOURCE_DIR"/ "$APP_DIR"/

cd "$APP_DIR"
npm ci --omit=dev || npm install --omit=dev

if [[ "$DRY_RUN" != "true" ]]; then
  install -m 644 "$APP_DIR/scripts/turtlebot.service" "/etc/systemd/system/$SERVICE_NAME"
fi

do_service systemctl daemon-reload
do_service systemctl restart "$SERVICE_NAME"

rm -rf "$BACKUP_DIR"
UPDATED=0

echo "Update complete."
do_service systemctl status "$SERVICE_NAME" --no-pager || true
