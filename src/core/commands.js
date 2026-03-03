import { appendMemory } from './memory.js';
import { providersStatus } from './providers.js';

export async function handleCommand({ text, config, state, history }) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;

  if (trimmed === '/help') {
    return [
      'Commands:',
      '/help',
      '/status',
      '/model',
      '/providers',
      '/mode ollama|openai|anthropic',
      '/pin <note>',
      '/clear'
    ].join('\n');
  }

  if (trimmed === '/status') {
    return [
      `provider=${state.provider}`,
      `model=${state.model}`,
      `thinkModel=${state.thinkModel}`,
      `history=${history.length}/${config.maxHistory}`,
      `execPolicy=${config.execPolicy}`
    ].join('\n');
  }

  if (trimmed === '/model') return `model=${state.model}\nthinkModel=${state.thinkModel}`;

  if (trimmed === '/providers') {
    return providersStatus(config, state);
  }

  if (trimmed === '/clear') {
    history.length = 0;
    return 'History cleared.';
  }

  if (trimmed.startsWith('/mode ')) {
    const mode = trimmed.slice(6).trim().toLowerCase();
    if (!['ollama', 'openai', 'anthropic'].includes(mode)) return 'Usage: /mode ollama|openai|anthropic';
    state.provider = mode;
    if (mode === 'openai' && !config.openAiApiKey) {
      return 'Switched to openai mode, but OPENAI_API_KEY is missing.';
    }
    if (mode === 'anthropic' && !config.anthropicApiKey) {
      return 'Switched to anthropic mode, but ANTHROPIC_API_KEY is missing.';
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
