import { chatCompletion } from './model.js';
import { readFileTool, writeFileTool } from '../tools/files.js';
import { execTool } from '../tools/exec.js';

const toolDefs = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a text file from workspace',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write text content to file in workspace',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'exec',
      description: 'Run a shell command in workspace',
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] }
    }
  }
];

export async function runTurn({ config, history, userText, logger }) {
  const messages = [
    { role: 'system', content: 'You are TurtleBot: concise, safe, practical.' },
    ...history,
    { role: 'user', content: userText }
  ];

  const first = await chatCompletion({
    config,
    messages,
    tools: toolDefs
  });

  const msg = first.choices?.[0]?.message;
  if (!msg) return 'No response.';

  if (!msg.tool_calls?.length) {
    return msg.content || '(empty)';
  }

  const toolOutputs = [];
  for (const call of msg.tool_calls) {
    const args = JSON.parse(call.function.arguments || '{}');
    let out = '';
    try {
      if (call.function.name === 'read_file') out = await readFileTool({ workspaceDir: config.workspaceDir, ...args });
      if (call.function.name === 'write_file') out = await writeFileTool({ workspaceDir: config.workspaceDir, ...args });
      if (call.function.name === 'exec') {
        out = await execTool({
          ...args,
          cwd: config.workspaceDir,
          allowExec: config.allowExec,
          policy: config.execPolicy,
          allowlist: config.execAllowlist,
          confirmToken: config.execConfirmToken
        });
      }
    } catch (e) {
      out = `Tool error: ${e.message}`;
      logger.warn(out);
    }
    toolOutputs.push({
      role: 'tool',
      tool_call_id: call.id,
      content: String(out)
    });
  }

  const second = await chatCompletion({
    config,
    messages: [...messages, msg, ...toolOutputs]
  });

  return second.choices?.[0]?.message?.content || 'Done.';
}
