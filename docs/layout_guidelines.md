# Layout Architecture: Flexbox vs. CSS Grid

This guide outlines the structural standards for 'The Base' platform, helping maintain consistency across the intrinsic, content-aware design system.

## 🏗️ CSS Grid
**Use Grid for: Two-dimensional layouts, fixed structures, and high-density data visualizations.**

### When to use Grid:
- **Major Page Layouts**: Use Grid for the high-level skeleton of a page (e.g., Sidebar + Main Content).
- **Fixed Component Structures**: When you need exact control over both columns and rows simultaneously.
- **Complex Forms**: Multi-column forms where fields need to align perfectly across rows.
- **Dashboard Widgets**: When a section requires a rigid structure that doesn't necessarily depend on the content size (e.g., a 2x2 grid of charts).

### Examples in the Project:
- `AdminLayout`: Uses grid for the sidebar/content split.
- `MediaLibrary`: Uses grid for the asset thumbnail gallery.

---

## 🌊 Flexbox
**Use Flex for: One-dimensional layouts, intrinsic responsiveness, and fluid content flow.**

### When to use Flexbox:
- **Headers & Toolbars**: Aligning a title to the left and buttons to the right (`justify-between`).
- **Intrinsic Columns**: Using `.flex-columns` for components that should automatically stack based on their container's width, not the viewport.
- **Vertical Rhythm**: Using `.flow` to manage consistent spacing between paragraphs, headings, and buttons.
- **Micro-alignments**: centering icons with text, aligning buttons in a row, or stacking metadata.

### Examples in the Project:
- `Dashboard Header`: Uses `flex-columns flex-between` to push buttons to the far right.
- `KPI Cards`: Uses `flex-columns` to stack cards on small devices and spread them out on large ones.
- `Lists/Feeds`: The `WarRoomCommand` incident list uses flexbox to manage the alignment of status badges and timestamps.

---

## 🏁 Summary Table

| Feature | Use Flexbox | Use CSS Grid |
| :--- | :--- | :--- |
| **Primary Direction** | 1D (Row OR Column) | 2D (Row AND Column) |
| **Alignment** | Content-driven | Layout-driven |
| **Responsiveness** | Fluid/Intrinsic | Structure-first |
| **Gaps** | Flexible (Gap property) | Fixed (Grid-gap property) |
| **Overlap** | Difficult | Easy (Layering items) |

## 💡 The "Base" Rule
If you find yourself using `width: 50%` or `grid-cols-2` inside a component, ask if it should be **intrinsic**. 
- If the content should define the space: **Use Flexbox**.
- If the layout must remain rigid regardless of content: **Use Grid**.
