# Headroom — Agent-Side Token Optimization Evaluation

**Project:** The Base Movement (`C:/MAMP/htdocs/The-Base`)  
**Repo evaluated:** https://github.com/chopratejas/headroom  
**Date:** 2026-06-09

---

## What Headroom Does

Headroom is a context compression layer for AI coding agents. It intercepts tool outputs, logs, file reads, and conversation history, applies smart reversible compression (60–95% token reduction), and serves the compressed summary to the LLM. Original data is kept locally and can be retrieved on demand.

It operates as:

- A **library** (`compress(messages)` callable in Python or TypeScript)
- A **CLI wrapper** (`headroom wrap claude`) that wraps the agent process
- An **HTTP proxy** (drop-in replacement for OpenAI-compatible clients)
- An **MCP server** (exposes `headroom_compress`, `headroom_retrieve`, `headroom_stats` tools)

Headroom explicitly supports Claude Code, Codex, Cursor, Aider, and GitHub Copilot CLI. All data stays local — nothing leaves the machine.

---

## Should It Be Used in This Project?

**Yes, with narrow scope.** This project has several context-heavy patterns that Headroom is well-suited for:

- `adminService.ts` is 92 KB — reading sections in agent sessions generates large tool outputs
- `src/index.css` is 52 KB — same pattern
- `src/types/admin.ts` is 922 lines
- Supabase migration files are verbose SQL
- `npm run build` output is long and repetitive
- Long planning sessions (multi-task subagent-driven-development) accumulate context fast

Headroom's reversible compression (CCR) means the agent can still retrieve original content if a summary misses detail — making it safer than destructive truncation.

---

## What It Should Be Used For

- Terminal output from `npm run build`, `npm run typecheck`, `npm run lint`
- `supabase db push` / migration output
- Large file reads (`adminService.ts`, `index.css`, `admin.ts`)
- Docs scans (`docs/`, `supabase/migrations/`)
- Repeated context across long agent sessions (planning → implementation → review)
- Subagent tool outputs (each subagent report returned to the controller)
- Repo summary generation at session start

---

## What It Must NOT Be Used For

- Frontend or runtime app code — Headroom must never appear in `src/`, `public/`, or any deployed asset
- KPI/dashboard components — these must render live data, not compressed summaries
- Auth, database, or routing code
- As a replacement for `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or workflow/skill files — those are structural, not compressible context
- Production feature dependency — it is purely a dev-time agent layer

---

## Risks and Limitations

| Risk                                                        | Severity | Notes                                                                                      |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Compressed summary misses a critical detail                 | Medium   | Mitigated by CCR (retrieve original on demand)                                             |
| MCP server adds process overhead                            | Low      | Runs locally, no network calls                                                             |
| Requires Python 3.10+ (MCP/CLI mode) or Node (library mode) | Low      | Node already present in this project                                                       |
| Not useful if native provider compression is sufficient     | Low      | Claude Code already has compaction; Headroom adds value for large single-turn tool outputs |
| `headroom learn` writes corrections to agent markdown files | Medium   | Monitor — do not let it overwrite `CLAUDE.md` or skill files automatically                 |

---

## Safe Test Plan

1. **Install in dev-only scope** (do not add to `package.json` dependencies, use global or npx):

   ```bash
   npm install -g headroom-ai
   # or: npx headroom-ai wrap claude
   ```

2. **Test with CLI wrapper only first** — does not touch any project files:

   ```bash
   headroom wrap claude
   ```

   Run a normal session with a large file read (`adminService.ts`). Compare token usage before/after.

3. **Verify output quality** — confirm compressed build output still conveys errors accurately.

4. **Do NOT enable `headroom learn`** without reviewing what it would write and where.

5. **Do NOT use the proxy mode** unless you need cross-agent memory sharing — the CLI wrapper is sufficient.

---

## Exact Install Commands (from Headroom repo)

```bash
# Node/TypeScript (recommended for this project)
npm install headroom-ai

# Python (for CLI/MCP server mode)
pip install "headroom-ai[all]"

# CLI wrapper usage (no project files modified)
headroom wrap claude

# MCP server (adds headroom_compress, headroom_retrieve tools to Claude)
headroom mcp
```

---

## Recommendation

**Test first, then adopt for agent-only use.**

Install globally or via `npx` (not as a project dependency). Start with the CLI wrapper on sessions that read large service files. If token savings are confirmed and output quality holds, adopt as a standard dev-session wrapper.

**Do not install until explicitly requested.** The `CLAUDE.md` already documents the permitted usage boundaries.
