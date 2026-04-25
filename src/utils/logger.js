const levels = { error: 0, warn: 1, info: 2, debug: 3 };

/**
 * Create a lightweight logger.
 *
 * By default all output goes to console.error (error) or console.log (rest)
 * so it is visible in CLI/Telegram modes.
 *
 * In TUI mode the terminal is owned by blessed and raw writes to stdout/stderr
 * corrupt the display. Call logger.redirect(fn) after the TUI is ready to
 * route all log output through blessed instead.
 */
export function createLogger(level = 'info') {
  const current = levels[level] ?? levels.info;

  // Mutable output functions — can be swapped by redirect().
  let stdoutWrite = (...args) => console.log(...args);
  let stderrWrite = (...args) => console.error(...args);

  const logger = {
    error: (...args) => { if (current >= 0) stderrWrite('[error]', ...args); },
    warn:  (...args) => { if (current >= 1) stdoutWrite('[warn]',  ...args); },
    info:  (...args) => { if (current >= 2) stdoutWrite('[info]',  ...args); },
    debug: (...args) => { if (current >= 3) stdoutWrite('[debug]', ...args); },

    /**
     * Redirect all output to fn(formattedString).
     * Called by the TUI after the blessed screen is initialised so log lines
     * are appended to the chat widget instead of raw stdout/stderr.
     */
    redirect(fn) {
      stdoutWrite = (...args) => fn(args.join(' '));
      stderrWrite = (...args) => fn(args.join(' '));
    }
  };

  return logger;
}
