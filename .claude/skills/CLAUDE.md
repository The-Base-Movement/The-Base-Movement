# Claude Code Instructions

## Response Style
- No explanations unless asked
- No summaries at the end of tasks
- No "I will now...", "Let me...", or similar preamble
- Output code only — no commentary around it
- If asked to fix something, show only the changed lines (diff style), not the full file
- Short answers for short questions

## File Handling
- Never read a file you've already read in this session unless told to
- Never re-read files to "confirm" changes — trust the edit
- Ask for the exact file path before scanning directories

## Task Behavior
- Do not run tests unless told to
- Do not install packages unless told to
- Do not create files not explicitly requested
- Do not suggest next steps unless asked

## Tool Use
- Prefer targeted reads (specific line ranges) over full file reads
- Do not use search/grep to find something if I've already told you where it is
- One tool call at a time for simple tasks — no parallel calls unless the task requires it
