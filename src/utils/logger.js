const levels = { error: 0, warn: 1, info: 2, debug: 3 };

export function createLogger(level = 'info') {
  const current = levels[level] ?? levels.info;
  return {
    error: (...args) => current >= 0 && console.error('[error]', ...args),
    warn: (...args) => current >= 1 && console.warn('[warn]', ...args),
    info: (...args) => current >= 2 && console.log('[info]', ...args),
    debug: (...args) => current >= 3 && console.log('[debug]', ...args)
  };
}
