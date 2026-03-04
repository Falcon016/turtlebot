import { exec as cpExec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(cpExec);

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
  if (!allowlist?.length) return true;
  return allowlist.some((prefix) => command.trim().startsWith(prefix));
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

  if (policy === 'confirm' && !hasConfirmToken(command, confirmToken)) {
    throw new Error('Command missing EXEC_CONFIRM_TOKEN');
  }

  const { stdout, stderr } = await execAsync(command, { cwd, timeout: 20_000 });
  return [stdout, stderr].filter(Boolean).join('\n').slice(0, 12000);
}
