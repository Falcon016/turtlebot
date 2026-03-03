import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export function loadConfig() {
  const allowlist = (process.env.EXEC_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    modelProvider: process.env.MODEL_PROVIDER || 'ollama',
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.MODEL || 'qwen3:4b',
    thinkModel: process.env.THINK_MODEL || 'lfm2.5-thinking',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramPollIntervalMs: Number(process.env.TELEGRAM_POLL_INTERVAL_MS || 2500),
    workspaceDir: path.resolve(process.env.WORKSPACE_DIR || './workspace'),
    logLevel: process.env.LOG_LEVEL || 'info',
    maxHistory: Number(process.env.MAX_HISTORY || 12),
    allowExec: (process.env.ALLOW_EXEC || 'true').toLowerCase() === 'true',
    execAllowlist: allowlist
  };
}
