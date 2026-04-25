import { toAnthropicMessages } from './model.js'; // you'll need to export this

const history = [
  { role: 'user', content: 'What files are here?' },
  { role: 'assistant', content: null, tool_calls: [{ id: 'tc_1', type: 'function', function: { name: 'list_files', arguments: '{"path":"."}' } }] },
  { role: 'tool', tool_call_id: 'tc_1', content: 'file1.txt\nfile2.js' },
  { role: 'assistant', content: 'I see two files: file1.txt and file2.js.' },
];

const converted = toAnthropicMessages(history);

// Check assistant message has tool_use block
const assistantMsg = converted[1];
console.assert(assistantMsg.role === 'assistant', 'assistant role');
console.assert(Array.isArray(assistantMsg.content), 'assistant content is array');
const toolUseBlock = assistantMsg.content.find(b => b.type === 'tool_use');
console.assert(toolUseBlock, 'has tool_use block');
console.assert(toolUseBlock.id === 'tc_1', 'tool_use id');
console.assert(toolUseBlock.name === 'list_files', 'tool_use name');
console.assert(toolUseBlock.input.path === '.', 'tool_use input');

// Check tool result becomes user message with tool_result block
const toolResultMsg = converted[2];
console.assert(toolResultMsg.role === 'user', 'tool result wrapped in user');
console.assert(Array.isArray(toolResultMsg.content), 'tool result content is array');
const trBlock = toolResultMsg.content[0];
console.assert(trBlock.type === 'tool_result', 'tool_result type');
console.assert(trBlock.tool_use_id === 'tc_1', 'tool_result id');
console.assert(trBlock.content === 'file1.txt\nfile2.js', 'tool_result content');

// Final message is plain assistant
console.assert(converted[3].content === 'I see two files: file1.txt and file2.js.', 'plain assistant');

console.log('All model conversion tests passed.');
