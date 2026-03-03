import blessed from 'blessed';
import { turtleTheme } from './theme.js';

export function createTui({ onSubmit, onCommand, getStatus }) {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'TurtleBot'
  });

  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: { fg: turtleTheme.text, bg: turtleTheme.panel },
    content: ' 🐢 {bold}TurtleBot{/bold}  lightweight claw shell\n {gray-fg}Ctrl+C quit • Ctrl+K clear • /help commands{/gray-fg}'
  });

  const status = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: turtleTheme.border }, bg: turtleTheme.bg, fg: turtleTheme.muted }
  });

  const log = blessed.log({
    top: 6,
    left: 0,
    width: '100%',
    bottom: 3,
    tags: true,
    border: { type: 'line' },
    label: ' chat ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      border: { fg: turtleTheme.border },
      bg: turtleTheme.bg,
      fg: turtleTheme.text
    }
  });

  const input = blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    inputOnFocus: true,
    border: { type: 'line' },
    style: {
      border: { fg: turtleTheme.border },
      bg: turtleTheme.panel,
      fg: turtleTheme.text
    }
  });

  screen.append(header);
  screen.append(status);
  screen.append(log);
  screen.append(input);

  function refreshStatus() {
    const text = getStatus();
    status.setContent(` ${text.replace(/\n/g, '\n ')}`);
  }

  function say(role, text) {
    const color = role === 'you' ? turtleTheme.accent : turtleTheme.text;
    log.add(`{${color}-fg}${role}>{/${color}-fg} ${text}`);
    refreshStatus();
    screen.render();
  }

  input.on('submit', async (value) => {
    const text = (value || '').trim();
    input.clearValue();
    screen.render();
    if (!text) return;

    say('you', text);

    try {
      if (text.startsWith('/')) {
        const cmd = await onCommand(text);
        say('bot', cmd);
      } else {
        const reply = await onSubmit(text);
        say('bot', reply);
      }
    } catch (e) {
      say('bot', `{red-fg}error:{/red-fg} ${e.message}`);
    }

    input.focus();
  });

  screen.key(['C-c'], () => process.exit(0));
  screen.key(['C-k'], () => {
    log.setContent('');
    screen.render();
  });

  refreshStatus();
  input.focus();
  screen.render();

  say('bot', 'TUI ready. Type /help for commands.');
}
