import fs from 'node:fs/promises';
import path from 'node:path';

function resolveSafe(workspaceDir, relPath) {
  const full = path.resolve(workspaceDir, relPath);
  if (!full.startsWith(workspaceDir)) throw new Error('Path escapes workspace');
  return full;
}

export async function readFileTool({ workspaceDir, path: relPath }) {
  const full = resolveSafe(workspaceDir, relPath);
  const data = await fs.readFile(full, 'utf8');
  return data.slice(0, 12000);
}

export async function writeFileTool({ workspaceDir, path: relPath, content }) {
  const full = resolveSafe(workspaceDir, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
  return `Wrote ${relPath}`;
}
