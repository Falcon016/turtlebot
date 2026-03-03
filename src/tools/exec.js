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

export async function execTool({ command, cwd, allowExec = true, allowlist = [] }) {
  if (!allowExec) {
    throw new Error('exec tool is disabled by config (ALLOW_EXEC=false)');
  }

  if (isBlocked(command)) {
    throw new Error('Blocked potentially dangerous command');
  }

  if (!isAllowlisted(command, allowlist)) {
    throw new Error('Command not in EXEC_ALLOWLIST');
  }

  const { stdout, stderr } = await execAsync(command, { cwd, timeout: 20_000 });
  return [stdout, stderr].filter(Boolean).join('\n').slice(0, 12000);
}
