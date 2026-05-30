---
name: Supabase CLI on Windows — npx fails, use MCP
description: npx supabase fails on win32-x64 with "No matching Supabase CLI binary package found"; use mcp__supabase__deploy_edge_function instead
type: project
---

`npx supabase functions deploy` exits with:

> No matching Supabase CLI binary package found for win32-x64

No native Supabase CLI binary is installed globally (not in PATH, not via scoop/choco/winget/AppData).

**Why:** The npm wrapper package for the Supabase CLI doesn't include a win32-x64 binary in the cached npx version on this machine.

**How to apply:** Always use `mcp__supabase__deploy_edge_function` (MCP tool) for edge function deploys on this machine. Pass all function files including `_shared/` dependencies as the `files` array. The project ref is `vhlyekyxutwbxlvktnzd`.
