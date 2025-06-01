import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import testingLibraryPlugin from 'eslint-plugin-testing-library'; // Added import

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error', // or 'warn'
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'caughtErrorsIgnorePattern': '^_'
        }
      ],
      // It's good practice to disable type-aware linting rules in JS files if you have mixed JS/TS project parts
      // This project seems to be TS-only for linted files based on files: ['**/*.{ts,tsx}']
    },
  },
  // Configuration for test files
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      ...testingLibraryPlugin.configs.react.rules,
      // You can override or add specific rules here if needed
      // For example, to specifically address 'testing-library/no-node-access':
      // 'testing-library/no-node-access': 'warn', // or 'error'
    },
  }
);
