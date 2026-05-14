# Claude Code Instructions — The Base Movement

## Response Style
- No explanations unless asked
- No summaries at the end of tasks
- No "I will now...", "Let me...", or similar preamble
- Short answers for short questions
- One sentence updates while working — don't go silent

## File Handling
- Never re-read files to "confirm" changes — trust the edit
- Prefer targeted reads (specific line ranges) over full file reads
- CLAUDE.md at project root has the full design system reference — read it first on any UI task

## Task Behavior
- Do not run tests unless told to
- Do not install packages unless told to
- Do not create files not explicitly requested
- Do not suggest next steps unless asked
- Run `npx tsc --noEmit` before every commit — fix all errors first

## Tool Use
- Parallel tool calls when independent (read + read, check + check)
- Sequential when dependent (read before edit)
- Use Grep/Glob before spawning agents for simple lookups

## Design System Rules (enforced on every UI edit)
- No lucide-react imports in dashboard/admin pages
- No shadcn component imports (Button, Input, Select, Dialog, Sheet, Tabs, DropdownMenu) in migrated pages
- Always use Material Symbols for icons
- Always use CSS variable color tokens — never hardcode colors except #fff/#000
- `.panel` for cards, `.btn .btn-primary/.btn-outline/.btn-dest/.btn-sm` for buttons, `.pill .pill-ok/.pill-warn/.pill-mute` for badges
- Typography: `fontFamily: "'Public Sans', sans-serif"`, weight 700 (body) or 800 (labels/headings)