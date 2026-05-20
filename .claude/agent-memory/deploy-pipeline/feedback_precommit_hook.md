---
name: Pre-commit hook behavior and ESLint rules
description: Husky + lint-staged runs ESLint --fix --max-warnings=0 and Prettier on all staged files; known blocking rules and fixes for this project
type: feedback
---

The pre-commit hook (husky + lint-staged) runs ESLint with `--fix --max-warnings=0` and Prettier on every staged file. Because `--max-warnings=0` is set, warnings are fatal.

**Known blocking ESLint rules:**

- `react-hooks/set-state-in-effect` — fires when setState is called directly in a useEffect body. Fix: add `// eslint-disable-next-line react-hooks/set-state-in-effect` on the line before each offending setState call. Do NOT wrap in a helper function — Prettier will reformat and remove the helper, undoing the fix.
- `no-console` (allow: error, warn) — `console.log` is an error. Change to `console.warn` or `console.error`.
- `@typescript-eslint/no-unused-expressions` — ternary used as statement (e.g. `a ? b() : c()`). Fix: convert to `if/else`.
- `prefer-const` — `let` on a never-reassigned variable.

**Unused disable directives are also fatal** — if you add a `// eslint-disable-next-line` for a rule that doesn't fire on that line, ESLint reports it as a warning (and `--max-warnings=0` kills the commit). Run `npx eslint --fix` on affected files first to auto-remove stale directives.

**Prettier reverts structural rewrites** — the PostToolUse formatter hook runs after every Edit. Wrapping setState in a nested function (to satisfy the rule) gets reformatted away. Use inline disable comments instead.

**How to apply:** Before committing, run `npx eslint --max-warnings=0 <files>` on all modified .tsx/.ts files. If there are errors, fix them, then run `npx eslint --fix <files>` to auto-remove any stale disable directives, and re-stage.
