import { spawn } from 'child_process';
import path from 'path';

const BLOCK_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bdd\b/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpkill\b/i,
  /\bkillall\b/i,
  /\bnc\b/i,
  /\bnetcat\b/i,
  /\beval\b/i,
  /\b(curl|wget)\b.*\|\s*(sh|bash|zsh|python3?|node)\b/i,
  /\bpython3?\s+-c\b/i,
  /\bnode\s+-e\b/i,
  /\bperl\s+-e\b/i,
  /\bruby\s+-e\b/i,
  /:\s*\(\)\s*\{\s*:\|:\s*&\s*\};:/,
];

/** Tokenise a shell-style command string into [bin, ...args].
 *  Handles single/double-quoted tokens; throws on unmatched quotes. */
function tokenise(cmd) {
  const tokens = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (ch === ' ' && !inSingle && !inDouble) {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (inSingle || inDouble) throw new Error('Unmatched quote in command');
  if (current) tokens.push(current);
  if (!tokens.length) throw new Error('Empty command');
  return tokens;
}

/** Reject binaries with path separators, leading dots, or suspicious chars. */
function isSafeBinaryName(bin) {
  if (!bin) return false;
  if (bin.includes('/') || bin.includes('\\')) return false;
  if (bin.startsWith('.')) return false;
  if (/[;&|`$(){}<>]/.test(bin)) return false;
  return true;
}

export async function execTool({
  command,
  cwd,
  allowExec = true,
  allowlist = [],
  timeoutMs = 20_000,
  maxOutputBytes = 32_768,
} = {}) {
  if (!allowExec) return { output: '', error: 'exec disabled', exitCode: -1 };

  // Blocklist check (on the raw command string)
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(command)) {
      return { output: '', error: `Blocked by policy: ${pattern}`, exitCode: -1 };
    }
  }

  const tokens = tokenise(command);
  const [bin, ...args] = tokens;

  if (!isSafeBinaryName(bin)) {
    return { output: '', error: `Unsafe binary name: ${bin}`, exitCode: -1 };
  }

  // Allowlist check (exact binary match)
  if (allowlist.length > 0 && !allowlist.includes(bin)) {
    return { output: '', error: `Binary not in allowlist: ${bin}`, exitCode: -1 };
  }

  return new Promise((resolve) => {
    const chunks = [];
    let totalBytes = 0;
    let truncated = false;

    const child = spawn(bin, args, {
      cwd: cwd || process.cwd(),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const onData = (data) => {
      if (truncated) return;
      totalBytes += data.length;
      if (totalBytes > maxOutputBytes) {
        truncated = true;
        chunks.push(data.slice(0, data.length - (totalBytes - maxOutputBytes)));
        return;
      }
      chunks.push(data);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      const out = Buffer.concat(chunks).toString() + (truncated ? '\n[output truncated]' : '');
      resolve({ output: out, error: 'timeout', exitCode: -1 });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      const output = Buffer.concat(chunks).toString() + (truncated ? '\n[output truncated]' : '');
      resolve({ output, error: null, exitCode: code ?? 0 });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ output: '', error: err.message, exitCode: -1 });
    });
  });
}
