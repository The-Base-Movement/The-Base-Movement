# Typography Modernization & Responsive Scaling Implementation Plan

## Objective
Implement a production-grade typography management system that allows leadership to adjust font sizes across the entire platform via the Admin Settings without modifying code. Utilize the CSS `clamp()` function to ensure headings and body text adapt dynamically to screen size and container constraints, preventing layout breaks.

## 1. Architectural Strategy: The Variable-Driven Model
We will implement a hierarchical typography system controlled by global CSS variables. These variables will be injected into the `:root` by the `BrandingContext` and can be adjusted in real-time from the database.

### CSS `clamp()` Logic
Each heading and body text style will use a `clamp()` function with the following structure:
`font-size: clamp(min, preferred, max)`

To enable administrative control, we will introduce a **Global Font Scale** (`--font-scale`) and **Heading Multiplier** (`--font-heading-scale`) that proportionally adjust these values.

## 2. Technical Roadmap

### Phase 1: Type Definitions (`types/branding.ts`)
Add the following attributes to the `BrandingSettings` interface:
- `font_scale_global`: (number) - Adjusts all font sizes proportionally (default: 1.0)
- `font_scale_headings`: (number) - Additional multiplier for h1-h6 (default: 1.0)
- `font_family_primary`: (string) - Custom font family selection.

### Phase 2: Context Injection (`BrandingContext.tsx`)
Update the dynamic `<style>` block to compute and inject the following:
```css
:root {
  --font-scale: ${settings.font_scale_global || 1.0};
  --font-heading-scale: ${settings.font_scale_headings || 1.0};
  
  /* Derived Responsive Sizes */
  --h1-size: clamp(calc(1.75rem * var(--font-heading-scale)), calc(4.5vw * var(--font-heading-scale)), calc(3.5rem * var(--font-heading-scale)));
  --h2-size: clamp(calc(1.5rem * var(--font-heading-scale)), calc(3.5vw * var(--font-heading-scale)), calc(2.75rem * var(--font-heading-scale)));
  --h3-size: clamp(calc(1.25rem * var(--font-heading-scale)), calc(2.5vw * var(--font-heading-scale)), calc(2rem * var(--font-heading-scale)));
  --p-size: clamp(calc(0.875rem * var(--font-scale)), calc(0.5vw + 0.75rem), calc(1.125rem * var(--font-scale)));
}
```

### Phase 3: Global CSS Refactoring (`index.css`)
Update the base typography styles to consume the new variables:
```css
h1 { font-size: var(--h1-size); }
h2 { font-size: var(--h2-size); }
h3 { font-size: var(--h3-size); }
p { font-size: var(--p-size); }
```

### Phase 4: Administrative Command Suite (`AdminSettings.tsx`)
- Add a "Typography Control" section to the Site Branding tab.
- Implement high-fidelity sliders for "Global Scale" and "Heading Emphasis".
- Provide a real-time preview of the font scaling within the settings panel.

## 3. Visual Excellence & Safety
- **Adaptive Fitting**: The use of `vw` units within `clamp()` ensures that text shrinks on smaller viewports before hitting the `min` value, maintaining layout integrity in restricted spaces (like sidebars).
- **Zero-Code Management**: Leadership can fine-tune the "feel" of the dashboard's information density instantly.
- **Architectural Parity**: All modules (Store, Roadmap, Strategic Priorities) will inherit these scales automatically.

## 5. The General Rule (Visual Uniformity)

To ensure total visual excellence and architectural parity across the platform, all pages must strictly adhere to the following "General Rule" for typography and title orchestration:

### 1. Title Section Anatomy
Every primary page must lead with a high-fidelity title section containing:
- **Primary Heading (H1)**: Clear, bold, and authoritative. Avoid `uppercase` for long titles; use it only for short, impactful headers.
- **The Triple-Pillar Line**: A 3-color accent line (`bg-destructive`, `bg-accent`, `bg-primary`) must be placed immediately below the H1 to anchor the branding.
- **Subtitle/Description**: Balanced, readable text (typically `text-slate-300` or similar) that provides context.
- **Label (Optional)**: A small, pill-style label with a pulsing green indicator for high-priority modules.

### 2. Heading Prioritization
- **H1 - H4**: These are the primary structural levels.
- **H5 - H6**: Deprioritized. Use these only for extremely fine-grained detail. If a heading is too small to be legible at first glance, it must be refactored to a higher level or a styled paragraph.
- **Font Weight**: Strictly avoid `font-black` (900) for large text blocks. Use `font-bold` (700) or `font-semibold` (600) to maintain high-end aesthetics without visual overbearing.

### 3. Case Orchestration
- **Avoid ALL CAPS**: Do not use full-page or full-section capitalization. Use `capitalize` for names/titles and `uppercase` only for small meta-labels or short CTA text.
- **Tracking**: Use `tracking-tight` or `tracking-tighter` for large headings, and moderate tracking for labels. Avoid `tracking-widest` for body text or large headings.

## 6. Implementation Prompt for Page Refactoring

When refactoring a page for typographic uniformity, apply this checklist:
1. Identify the primary `h1`. Ensure it is `font-bold` and follows the responsive scale.
2. Inject the **Red-Gold-Green Line** (`flex h-1 w-24 mb-6`) below the title.
3. Ensure the subtitle matches the `text-slate-300` style from the "Plan" page.
4. Audit all `h5` and `h6` tags. If they are too small, promote them to `h4` or adjust their base styling in `index.css`.
5. Remove all `font-black` and excessive `uppercase` utility classes.
