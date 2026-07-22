import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import ts from 'typescript-eslint'

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      // ── Vue ──
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
      'vue/component-tags-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/attribute-hyphenation': ['error', 'never'],
      'vue/v-on-event-hyphenation': ['error', 'never'],
      'vue/order-in-components': 'off',

      // ── TypeScript ──
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // ── General ──
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // ── Import order ──
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'never',
        'alphabetize': { order: 'asc', caseInsensitive: true },
      }],
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.d.ts', 'vite.config.*', 'tailwind.config.*', 'postcss.config.*'],
  }
)
