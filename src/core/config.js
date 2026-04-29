import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const VALID_PROVIDERS = ['ollama', 'openai', 'anthropic', 'ollama-cli'];
const VALID_EXEC_POLICIES = ['off', 'allowlist', 'confirm', 'open'];

/**
 * Parse a non-negative integer from an environment variable.
 * Throws with a clear message if the value is not a number or < 0.
 * Empty string and undefined both fall through to defaultValue.
 */
function requireNonNegativeInt(name, raw, defaultValue) {
  const value = raw !== undefined && raw !== '' ? Number(raw) : defaultValue;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `Config error: ${name}="${raw}" is not a non-negative integer (got ${value})`
    );
  }
  return value;
}

export function loadConfig() {
  // ── Numeric fields ──────────────────────────────────────────────────────────
  const maxHistory = requireNonNegativeInt(
    'MAX_HISTORY',
    process.env.MAX_HISTORY,
    12
  );
  const telegramPollIntervalMs = requireNonNegativeInt(
    'TELEGRAM_POLL_INTERVAL_MS',
    process.env.TELEGRAM_POLL_INTERVAL_MS,
    2500
  );
  const ollamaTimeoutMs = requireNonNegativeInt(
    'OLLAMA_TIMEOUT_MS',
    process.env.OLLAMA_TIMEOUT_MS,
    45000
  );
  const ollamaRetries = requireNonNegativeInt(
    'OLLAMA_RETRIES',
    process.env.OLLAMA_RETRIES,
    1
  );
  const execTimeoutMs = requireNonNegativeInt(
    'EXEC_TIMEOUT_MS',
    process.env.EXEC_TIMEOUT_MS,
    20000
  );

  // ── Enum fields ─────────────────────────────────────────────────────────────
  const modelProvider = process.env.MODEL_PROVIDER || 'ollama';
  if (!VALID_PROVIDERS.includes(modelProvider)) {
    throw new Error(
      `Config error: MODEL_PROVIDER="${modelProvider}" is not valid. ` +
      `Must be one of: ${VALID_PROVIDERS.join(', ')}`
    );
  }

  const execPolicy = process.env.EXEC_POLICY || 'allowlist';
  if (!VALID_EXEC_POLICIES.includes(execPolicy)) {
    throw new Error(
      `Config error: EXEC_POLICY="${execPolicy}" is not valid. ` +
      `Must be one of: ${VALID_EXEC_POLICIES.join(', ')}`
    );
  }

  // ── Allowlist ───────────────────────────────────────────────────────────────
  const allowlist = (process.env.EXEC_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    modelProvider,
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.MODEL || 'qwen3:4b',
    thinkModel: process.env.THINK_MODEL || 'lfm2.5-thinking',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramPollIntervalMs,
    workspaceDir: path.resolve(process.env.WORKSPACE_DIR || './workspace'),
    logLevel: process.env.LOG_LEVEL || 'info',
    maxHistory,
    allowExec: (process.env.ALLOW_EXEC || 'true').toLowerCase() === 'true',
    execPolicy,
    execAllowlist: allowlist,
    execConfirmToken: process.env.EXEC_CONFIRM_TOKEN || '',
    ollamaTimeoutMs,
    ollamaRetries,
    execTimeoutMs
  };
}
