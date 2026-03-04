#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Falcon016/turtlebot.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/turtlebot}"
BRANCH="${BRANCH:-main}"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1"; exit 1; }; }

need_cmd git
need_cmd bash
need_cmd node
need_cmd npm

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "Updating existing TurtleBot at $INSTALL_DIR ..."
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH"
else
  echo "Cloning TurtleBot into $INSTALL_DIR ..."
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

npm ci || npm install
[[ -f .env ]] || cp .env.example .env

echo
bash scripts/setup-config.sh

echo
if [[ "${QUICKSTART_NO_SERVICE:-false}" == "true" ]]; then
  echo "Skipping service install (QUICKSTART_NO_SERVICE=true)."
  echo "Run now: cd $INSTALL_DIR && npm run tui"
  exit 0
fi

case "$(uname -s)" in
  Darwin)
    echo "Detected macOS: installing launchd service..."
    bash scripts/install-macos.sh
    bash scripts/doctor-macos.sh || true
    ;;
  Linux)
    echo "Detected Linux: installing systemd service..."
    if [[ "${EUID}" -eq 0 ]]; then
      bash scripts/install.sh
    elif command -v sudo >/dev/null 2>&1; then
      sudo bash scripts/install.sh
    else
      echo "sudo not found. Run manually: sudo bash scripts/install.sh"
      exit 1
    fi
    bash scripts/doctor.sh || true
    ;;
  *)
    echo "Unsupported OS: $(uname -s)"
    echo "Manual start: npm run tui"
    exit 1
    ;;
esac

echo
 echo "TurtleBot quickstart complete."
 echo "Run now: cd $INSTALL_DIR && npm run tui"
