import fs from 'node:fs/promises';
import path from 'node:path';

export async function appendMemory(workspaceDir, line) {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(workspaceDir, 'memory');
  const file = path.join(dir, `${date}.md`);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(file, `- ${new Date().toISOString()} ${line}\n`, 'utf8');
}
