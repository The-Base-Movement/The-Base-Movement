# Deploy Pipeline Memory Index

- [Pre-commit hook ESLint rules](feedback_precommit_hook.md) — husky+lint-staged blocks on react-hooks/set-state-in-effect, no-console, no-unused-expressions; fix patterns and Prettier caveat
- [Supabase CLI auth requirement](project_supabase_auth.md) — 401 on edge function deploy means CLI session expired; active functions: ocr-verify, broadcast-dispatcher, notify-leads
- [Supabase CLI on Windows — use MCP](project_supabase_cli_windows.md) — npx supabase fails win32-x64; use mcp**supabase**deploy_edge_function with project ref vhlyekyxutwbxlvktnzd
- [tsc --noEmit vs tsc -b discrepancy](project_tsc_build_discrepancy.md) — Step 1 can pass while Step 2 fails; tsc -b is stricter than --noEmit (composite mode)
