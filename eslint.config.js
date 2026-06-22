import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'docs', 'public/sw.js', 'supabase/functions/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Warn when using 'any' to encourage proper TypeScript typing
      '@typescript-eslint/no-explicit-any': 'warn',
      // Warn on console.log statements to avoid leaking logs in production
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Error on unused variables to keep codebase clean
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Warn when setting state in useEffect to prevent infinite loops
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Allow Node.js CLI scripts to use console logs
  {
    files: ['scripts/**/*.{ts,js,cjs,mjs}'],
    rules: {
      'no-console': 'off',
    },
  },
])
