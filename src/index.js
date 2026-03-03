import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { loadConfig } from './core/config.js';
import { createLogger } from './utils/logger.js';
import { runTurn } from './core/agent.js';
import { appendMemory } from './core/memory.js';
import { getUpdates, sendMessage } from './adapters/telegram.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const history = [];

let runtimeProvider = config.modelProvider;
let runtimeModel = config.model;
let runtimeThinkModel = config.thinkModel;

await fs.mkdir(config.workspaceDir, { recursive: true });
await fs.mkdir(path.join(config.workspaceDir, 'memory'), { recursive: true });

function activeConfig() {
  return {
    ...config,
    modelProvider: runtimeProvider,
    model: runtimeModel,
    thinkModel: runtimeThinkModel
  };
}

function pushHistory(role, content) {
  history.push({ role, content });
  while (history.length > config.maxHistory) history.shift();
}

function statusText() {
  return [
    `provider=${runtimeProvider}`,
    `model=${runtimeModel}`,
    `thinkModel=${runtimeThinkModel}`,
    `history=${history.length}/${config.maxHistory}`,
    `execPolicy=${config.execPolicy}`,
    `workspace=${config.workspaceDir}`
  ].join('\n');
}

function helpText() {
  return [
    'TurtleBot commands:',
    '/help - show commands',
    '/status - runtime status',
    '/model - show active models',
    '/mode ollama|openai - switch provider for this runtime',
    '/pin <text> - save important memory note',
    '/clear - clear in-memory chat history'
  ].join('\n');
}

async function handleCommand(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;

  if (trimmed === '/help') return helpText();
  if (trimmed === '/status') return statusText();
  if (trimmed === '/model') return `model=${runtimeModel}\nthinkModel=${runtimeThinkModel}`;
  if (trimmed === '/clear') {
    history.length = 0;
    return 'History cleared.';
  }
  if (trimmed.startsWith('/mode ')) {
    const mode = trimmed.slice(6).trim().toLowerCase();
    if (!['ollama', 'openai'].includes(mode)) return 'Usage: /mode ollama|openai';
    runtimeProvider = mode;
    if (mode === 'openai' && !config.openAiApiKey) {
      return 'Switched to openai mode, but OPENAI_API_KEY is missing.';
    }
    return `Switched mode to ${mode}.`;
  }
  if (trimmed.startsWith('/pin ')) {
    const note = trimmed.slice(5).trim();
    if (!note) return 'Usage: /pin <important note>';
    await appendMemory(config.workspaceDir, `[PIN] ${note}`);
    return 'Pinned to memory.';
  }

  return 'Unknown command. Use /help';
}

function providerReady(cfg) {
  if (cfg.modelProvider === 'openai') {
    return Boolean(cfg.openAiApiKey);
  }
  return true;
}

async function handleText(text) {
  const cmdReply = await handleCommand(text);
  if (cmdReply !== null) return cmdReply;

  const cfg = activeConfig();
  if (!providerReady(cfg)) {
    return 'OpenAI mode is active but OPENAI_API_KEY is missing. Use /mode ollama or update .env.';
  }

  const reply = await runTurn({ config: cfg, history, userText: text, logger });
  pushHistory('user', text);
  pushHistory('assistant', reply);
  await appendMemory(config.workspaceDir, `User: ${text} | Assistant: ${reply.slice(0, 180)}`);
  return reply;
}

async function runTelegram() {
  logger.info('Starting Telegram mode');
  let offset = 0;
  while (true) {
    try {
      const updates = await getUpdates(config.telegramBotToken, offset);
      for (const u of updates) {
        offset = u.update_id + 1;
        const text = u.message?.text;
        const chatId = u.message?.chat?.id;
        if (!text || !chatId) continue;
        const reply = await handleText(text);
        await sendMessage(config.telegramBotToken, chatId, reply);
      }
    } catch (e) {
      logger.error('Telegram poll error:', e.message);
    }
    await new Promise((r) => setTimeout(r, config.telegramPollIntervalMs));
  }
}

async function runCli() {
  logger.info('Starting CLI mode');
  const rl = readline.createInterface({ input, output });
  while (true) {
    const text = await rl.question('you> ');
    if (text.trim().toLowerCase() === 'exit') break;
    const reply = await handleText(text);
    console.log(`turtle> ${reply}`);
  }
  rl.close();
}

if (config.telegramBotToken) {
  runTelegram();
} else {
  runCli();
}
