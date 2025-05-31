import globals from 'globals';
import js from '@eslint/js';
import pluginNode from 'eslint-plugin-node';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    plugins: {
      node: pluginNode,
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info', 'table', 'time', 'timeEnd'],
        },
      ],
      'no-shadow': ['error', { builtinGlobals: true, hoist: 'functions', allow: [] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
      'no-duplicate-imports': 'error',
      'node/no-unpublished-import': 'off',
      'node/no-missing-import': 'off',
      'node/no-unsupported-features/es-syntax': [
        'error',
        {
          version: '>=18.0.0',
          ignores: ['modules'],
        },
      ],
      'node/no-extraneous-import': [
        'warn',
        {
          allowModules: [],
        },
      ],
      'node/no-process-exit': 'warn',
      'node/handle-callback-err': ['error', '^(err|error)$'],
    },
  },

  js.configs.recommended,
  pluginNode.configs['flat/recommended-module'],

  eslintConfigPrettier,
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      '**/coverage/',
      '**/*.log',
      '.env',
      '.env.*',
      '*.md',
    ],
  },
];
