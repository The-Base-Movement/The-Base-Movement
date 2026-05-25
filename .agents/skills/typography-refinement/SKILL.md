---
name: typography-refinement
description: Use when adjusting typography, font weights, or text styles to ensure layout, structure, and design elements are strictly preserved without unwanted redesigns.
---

# Typography Refinement Guidelines

When instructed to refine, update, or downgrade typography (e.g., "no bold directive", changing weights from 700 to 500, or replacing `font-bold` with `font-medium`), you must strictly adhere to the following rules to ensure the existing design, layout, and component architecture remain completely untouched.

## Core Directives

1.  **Zero Structural Changes:** NEVER modify layout structures, grid configurations, flexbox alignments, margins, padding, borders, positioning, or DOM nesting when tasked with a typography update.
2.  **Surgical Edits Only:** Only target font-related properties. These include `fontWeight`, `font-weight`, `fontSize`, `font-size`, `fontFamily`, `font-family`, `lineHeight`, `line-height`, `letterSpacing`, `letter-spacing`, and typography utility classes (e.g., `font-bold`, `text-lg`).
3.  **No Component Redesign:** Do not rewrite, replace, or restructure components. If you find a component that uses a heavy font weight, simply update that specific class or inline style. Do not switch to a different component (e.g., do not swap a custom header implementation for an `AdminPageHeader` unless explicitly told to do so by the user).
4.  **Preserve Conditional Logic:** When updating styling inside conditional rendering or dynamic template literals, ensure the logic remains exactly the same. Only change the CSS class or style object values.
5.  **Use Exact Replacements:** Utilize the `replace` tool to perform surgical string replacements. Do not rewrite entire files or large blocks of code if a targeted replacement can achieve the goal.

## Execution Workflow

1.  **Analyze Intention:** Understand exactly which font properties or weights the user wants to adjust (e.g., "downgrade 700 to 500", "replace font-bold with font-medium").
2.  **Targeted Search:** Use `grep_search` to find instances of the targeted font weights, classes, or inline styles in the requested files.
3.  **Surgical Replacement:** Use the `replace` tool to specifically update the matched typography properties. Ensure you capture enough context in the `old_string` to make the replacement unique, but **do not alter the surrounding tags, properties, or logic**.
4.  **Verification:** Review the changes to guarantee that no structural elements (`div`s, flex properties, custom components) were accidentally altered or removed during the text replacement.
5.  **Validation:** Run typechecks or linters (e.g., `npm run typecheck`) to ensure the surgical edits did not introduce syntax errors.

By following this skill, you guarantee that typographic updates are applied safely, maintaining the absolute integrity of the application's original architecture and design layout.
