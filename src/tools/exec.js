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

function isAllowlisted(command, allowlist) {
  if (!allowlist?.length) return false;
  return allowlist.some((prefix) => command.trim().startsWith(prefix));
}

function tokenize(command) {
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return parts.map((p) => p.replace(/^['"]|['"]$/g, ''));
}

function runCommand({ command, cwd, timeoutMs = 20000 }) {
  return new Promise((resolve, reject) => {
    const tokens = tokenize(command);
    if (!tokens.length) {
      reject(new Error('Empty command'));
      return;
    }

    const [bin, ...args] = tokens;
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

  if (policy === 'allowlist' && !isAllowlisted(command, allowlist)) {
    throw new Error('Command not in EXEC_ALLOWLIST');
  }

  if (policy === 'allowlist' && !allowlist?.length) {
    throw new Error('EXEC_ALLOWLIST is empty while EXEC_POLICY=allowlist');
  }

  if (policy === 'confirm' && !hasConfirmToken(command, confirmToken)) {
    throw new Error('Command missing EXEC_CONFIRM_TOKEN');
  }

  return runCommand({ command, cwd, timeoutMs: 20000 });
}
