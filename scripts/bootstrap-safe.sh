#!/usr/bin/env bash
set -euo pipefail

RAW_URL="${RAW_URL:-https://raw.githubusercontent.com/Falcon016/turtlebot/main/scripts/bootstrap.sh}"
TMP_SCRIPT="$(mktemp /tmp/turtlebot-bootstrap.XXXXXX.sh)"

cleanup() {
  rm -f "$TMP_SCRIPT"
}
trap cleanup EXIT

echo "Downloading bootstrap script from:"
echo "  $RAW_URL"

curl -fsSL "$RAW_URL" -o "$TMP_SCRIPT"
chmod +x "$TMP_SCRIPT"

echo
echo "Preview (first 80 lines):"
echo "----------------------------------------"
sed -n '1,80p' "$TMP_SCRIPT"
echo "----------------------------------------"

echo
read -r -p "Run this script now? [y/N]: " ans
case "${ans:-}" in
  y|Y|yes|YES)
    echo "Running bootstrap..."
    exec bash "$TMP_SCRIPT"
    ;;
  *)
    echo "Aborted."
    exit 0
    ;;
esac
