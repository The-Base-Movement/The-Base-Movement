# Typography Modernization & Hardening Protocol

## MANDATORY AGENT DIRECTIVE
**ALL agent models and coding assistants MUST reference this document before performing ANY frontend modifications or UI component development.** Failure to adhere to the typographic standards outlined below constitutes an architectural violation of the movement's digital infrastructure.

## 1. The "General Rule" for Visual Excellence
To ensure professional consistency, premium information density, and institutional authority across the entire platform, all UI elements must strictly adhere to the following typographic configuration:

| Attribute | Protocol | Rationale |
| :--- | :--- | :--- |
| **Case** | `normal-case` | Eliminates legacy `uppercase` styling to ensure readability and professional maturity. |
| **Weight** | `font-bold` | Establishes structural authority; replaces legacy `font-black` (too heavy) or `font-medium` (too light for headers). |
| **Tracking** | `tracking-tight` | Purges erratic `tracking-widest` or `tracking-wider` tokens to achieve premium, high-fidelity density. |

## 2. Implementation Standards

### CSS `clamp()` for Responsive Scaling
Heading and body text must adapt dynamically to screen size using CSS `clamp()`. This prevents layout breaks on mobile and ensures readability on large displays.

`font-size: clamp(min, preferred, max)`

### Administrative Scaling Variables
The typography system is variable-driven, allowing real-time adjustments via the Admin Command Center:
- `--font-scale`: Proportional adjustment for all text (Global Scale).
- `--font-heading-scale`: Additional multiplier for institutional headers (H1-H6).

## 3. Component Hardening Checklist
When refactoring or creating components, agents MUST perform the following systematic purge:
- [x] **DELETE** all instances of `uppercase`.
- [x] **DELETE** all instances of `tracking-widest`, `tracking-wider`, or custom wide tracking (e.g., `tracking-[0.2em]`).
- [x] **DELETE** all instances of `font-black` or `font-extrabold`.
- [x] **REPLACE** with `normal-case font-bold tracking-tight`.

## 4. Design System Hardening: Tailwind Theme Sync (NEW)
As of May 2026, the typography system has been fully synchronized with the Tailwind theme configuration. 

### **Key Improvements:**
- **Zero-Override Architecture**: Standard Tailwind utilities (e.g., `text-sm`, `text-lg`, `text-h1`) are now natively mapped to our authoritative CSS variables. The legacy use of `!important` in `index.css` has been purged.
- **Fluid Scale Integration**: The `clamp()`-based responsive scale is now embedded directly into the Tailwind `fontSize` map, ensuring that any component using standard Tailwind classes automatically benefits from our responsive logic.
- **Token-Only Styling**: Developers MUST use standard Tailwind typography classes. Hardcoding pixel or rem values in component files is strictly prohibited.

## 5. Visual Branding: The BrandLine Protocol
To maintain institutional visual authority, all movement branding lines MUST utilize the centralized `<BrandLine />` component. Hardcoded implementations are strictly prohibited.

### Architectural Standards:
- **Component**: Always import and use `<BrandLine />` from `@/components/ui/BrandLine`.
- **Global Prominence**: The brand line dimensions are centrally managed in `index.css` (`.brand-line`) to ensure platform-wide consistency.
- **Normalization**: Legacy hardcoded sequences (e.g., `flex h-1 w-24`) have been purged and synchronized with the component architecture.

**Current Architectural State: HARDENED & SYNCED**
The platform now exhibits total typographic and visual parity. Every label, status badge, and branding element strictly follows the defined protocols. The design system is now 100% variable-driven, enabling true dynamic branding through the Admin Command Center.

**Vigilance Note**: Any future UI contributions must be audited against these standards prior to deployment. The legacy `tracking-wider`, `tracking-widest`, `uppercase`, and hardcoded branding sequences have been formally deprecated and purged from the digital infrastructure.
