import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals (available since Node 15 / 18)
        fetch: 'readonly',
        AbortController: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Catch common bugs
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'error',

      // Async safety
      'no-async-promise-executor': 'error',
      'require-await': 'warn',

      // Style — keep it light, just enforce consistency
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'no-var': 'error',
      'prefer-const': ['warn', { destructuring: 'all' }]
    }
  }
];
