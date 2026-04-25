import { exec as cpExec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(cpExec);

/**
 * Commands that are always blocked regardless of policy.
 * Covers destructive operations, privilege escalation, and common
 * code-execution-via-download patterns.
 */
const BLOCK_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpkill\b/i,
  /\bkillall\b/i,
  /\bnc\b/i,          // netcat
  /\bnetcat\b/i,
  /\beval\b/i,
  // Piped download-and-execute: curl/wget ... | sh/bash/python/node
  /\b(curl|wget)\b.*\|\s*(sh|bash|zsh|python3?|node)\b/i,
  // Inline interpreter execution
  /\bpython3?\s+-c\b/i,
  /\bnode\s+-e\b/i,
  /\bperl\s+-e\b/i,
  /\bruby\s+-e\b/i,
  // Fork bomb
  /:\s*\(\)\s*\{\s*:\|:\s*&\s*\};:/
];

/**
 * Shell metacharacters that allow chaining or injection.
 * In allowlist mode a command like `ls; rm -rf /` starts with `ls`
 * and would pass the prefix check without this guard.
 */
const SHELL_META_RE = /[;&|`$(){}<>]/;

function isBlocked(command) {
  return BLOCK_PATTERNS.some((re) => re.test(command));
}

/**
 * Returns true if the command starts with an allowlisted prefix AND
 * contains no shell metacharacters that could chain a second command.
 */
function isAllowlisted(command, allowlist) {
  if (!allowlist?.length) return true;
  const trimmed = command.trim();
  if (SHELL_META_RE.test(trimmed)) return false;
  return allowlist.some((prefix) => trimmed.startsWith(prefix));
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
  confirmToken = '',
  timeoutMs = 20_000
}) {
  if (!allowExec || policy === 'off') {
    throw new Error('exec tool is disabled by config');
  }

  if (isBlocked(command)) {
    throw new Error('Blocked potentially dangerous command');
  }

  if (policy === 'allowlist' && !isAllowlisted(command, allowlist)) {
    throw new Error(
      'Command not in EXEC_ALLOWLIST or contains disallowed shell operators'
    );
  }

  if (policy === 'confirm' && !hasConfirmToken(command, confirmToken)) {
    throw new Error('Command missing EXEC_CONFIRM_TOKEN');
  }

  const { stdout, stderr } = await execAsync(command, { cwd, timeout: timeoutMs });
  return [stdout, stderr].filter(Boolean).join('\n').slice(0, 12000);
}
