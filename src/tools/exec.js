import { spawn } from 'node:child_process';

const BLOCK_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /:\s*\(\)\s*\{\s*:\|:\s*&\s*\};:/ // fork bomb
];

function isBlocked(command) {
  return BLOCK_PATTERNS.some((re) => re.test(command));
}

function getAllowlistedExact(command, allowlist) {
  if (!allowlist?.length) return null;
  const normalized = command.trim();
  return allowlist.find((item) => item.trim() === normalized) || null;
}

function tokenize(command) {
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return parts.map((p) => p.replace(/^['"]|['"]$/g, ''));
}

function isSafeBinaryName(bin) {
  // Restrict the executable name to a conservative set of characters and disallow path separators.
  return /^[A-Za-z0-9._-]+$/.test(bin);
}

function runCommand({ command, cwd, timeoutMs = 20000 }) {
  return new Promise((resolve, reject) => {
    const tokens = tokenize(command);
    if (!tokens.length) {
      reject(new Error('Empty command'));
      return;
    }

    const [bin, ...args] = tokens;
    if (!isSafeBinaryName(bin)) {
      reject(new Error('Unsafe executable name in command'));
      return;
    }

    const child = spawn(bin, args, { cwd, shell: false });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Command timed out'));
    }, timeoutMs);

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve([stdout, stderr].filter(Boolean).join('\n').slice(0, 12000));
      } else {
        reject(new Error((stderr || `Command exited with code ${code}`).trim()));
      }
    });
  });
}

function hasConfirmToken(command, token) {
  if (!token) return true;
  return command.includes(token);
}

export async function execTool({
  command,
  cwd,
  allowExec = true,
  policy = 'allowlist',
  allowlist = [],
  confirmToken = ''
}) {
  if (!allowExec || policy === 'off') {
    throw new Error('exec tool is disabled by config');
  }

  if (isBlocked(command)) {
    throw new Error('Blocked potentially dangerous command');
  }

  let commandToRun = command;

  if (policy === 'allowlist') {
    if (!allowlist?.length) {
      throw new Error('EXEC_ALLOWLIST is empty while EXEC_POLICY=allowlist');
    }

    const exact = getAllowlistedExact(command, allowlist);
    if (!exact) {
      throw new Error('Command must exactly match an entry in EXEC_ALLOWLIST');
    }
    commandToRun = exact;
  }

  if (policy === 'confirm' && !hasConfirmToken(command, confirmToken)) {
    throw new Error('Command missing EXEC_CONFIRM_TOKEN');
  }

  return runCommand({ command: commandToRun, cwd, timeoutMs: 20000 });
}
