import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output, argv } from 'node:process';

import { loadConfig } from './core/config.js';
import { createLogger } from './utils/logger.js';
import { runTurn } from './core/agent.js';
import { appendMemory } from './core/memory.js';
import { handleCommand } from './core/commands.js';
import { getUpdates, sendMessage } from './adapters/telegram.js';
import { createTui } from './tui/app.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const history = [];

const state = {
  provider: config.modelProvider,
  model: config.model,
  thinkModel: config.thinkModel
};

await fs.mkdir(config.workspaceDir, { recursive: true });
await fs.mkdir(path.join(config.workspaceDir, 'memory'), { recursive: true });

function pushHistory(role, content) {
  history.push({ role, content });
  while (history.length > config.maxHistory) history.shift();
}

function activeConfig() {
  return {
    ...config,
    modelProvider: state.provider,
    model: state.model,
    thinkModel: state.thinkModel
  };
}

function providerReady(cfg) {
  return cfg.modelProvider !== 'openai' || Boolean(cfg.openAiApiKey);
}

function statusText() {
  return [
    `provider=${state.provider}`,
    `model=${state.model}`,
    `think=${state.thinkModel}`,
    `history=${history.length}/${config.maxHistory}`,
    `exec=${config.execPolicy}`
  ].join('\n');
}

async function handleText(text) {
  const cmdReply = await handleCommand({ text, config, state, history });
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

function runTui() {
  logger.info('Starting TUI mode');
  createTui({
    onSubmit: handleText,
    onCommand: (text) => handleCommand({ text, config, state, history }),
    getStatus: statusText
  });
}

if (argv.includes('--tui') || argv.includes('tui')) {
  runTui();
} else if (config.telegramBotToken) {
  runTelegram();
} else {
  runCli();
}
