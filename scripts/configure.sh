#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

echo "TurtleBot setup wizard"
echo "----------------------"

default_provider="$(grep '^MODEL_PROVIDER=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo ollama)"
read -r -p "Model provider (ollama/openai) [$default_provider]: " provider
provider="${provider:-$default_provider}"

if [[ "$provider" == "openai" ]]; then
  read -r -p "OpenAI API key: " api_key
  perl -0777 -i -pe "s/^MODEL_PROVIDER=.*/MODEL_PROVIDER=openai/m" "$ENV_FILE"
  perl -0777 -i -pe "s/^OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/m" "$ENV_FILE"
else
  read -r -p "Ollama base URL [http://127.0.0.1:11434]: " base_url
  base_url="${base_url:-http://127.0.0.1:11434}"
  perl -0777 -i -pe "s/^MODEL_PROVIDER=.*/MODEL_PROVIDER=ollama/m" "$ENV_FILE"
  perl -0777 -i -pe "s#^OLLAMA_BASE_URL=.*#OLLAMA_BASE_URL=$base_url#m" "$ENV_FILE"
fi

read -r -p "Telegram bot token (optional, press enter to skip): " tg
if [[ -n "$tg" ]]; then
  perl -0777 -i -pe "s/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$tg/m" "$ENV_FILE"
fi

echo "Configured: $ENV_FILE"
