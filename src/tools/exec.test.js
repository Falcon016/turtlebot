import { execTool } from './exec.js';

// allowlist hit
const r1 = await execTool({ command: 'echo hello', allowlist: ['echo'] });
console.assert(r1.output.trim() === 'hello', 'allowlist hit');
console.assert(r1.exitCode === 0, 'exit 0');

// allowlist miss
const r2 = await execTool({ command: 'ls -la', allowlist: ['echo'] });
console.assert(r2.error === 'Binary not in allowlist: ls', `allowlist miss: ${r2.error}`);

// blocklist
const r3 = await execTool({ command: 'sudo ls', allowlist: [] });
console.assert(r3.error && r3.error.startsWith('Blocked'), `blocklist: ${r3.error}`);

// unsafe binary (path separator)
const r4 = await execTool({ command: '/bin/ls', allowlist: [] });
console.assert(r4.error && r4.error.includes('Unsafe'), `unsafe bin: ${r4.error}`);

// timeout
const r5 = await execTool({ command: 'sleep 10', allowlist: ['sleep'], timeoutMs: 100 });
console.assert(r5.error === 'timeout', `timeout: ${r5.error}`);

// truncation
const r6 = await execTool({ command: 'yes', allowlist: ['yes'], timeoutMs: 500, maxOutputBytes: 100 });
console.assert(r6.output.includes('[output truncated]'), `truncation: ${r6.output.slice(0,80)}`);

console.log('All exec tests passed.');
