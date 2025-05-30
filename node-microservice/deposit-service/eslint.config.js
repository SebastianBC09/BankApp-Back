import js from '@eslint/js';
import pluginNode from 'eslint-plugin-node';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: true,
        console: true,
        module: true,
        require: true,
        __dirname: true,
        __filename: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    plugins: {
      node: pluginNode,
    },
    rules: {
      'no-console': 'off',
    },
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.log', '.env'],
  },
];
