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

## 4. Phase 3: Final Synchronization (COMPLETED)
- [x] Comprehensive Grep Audit of `src` directory
- [x] Refactored `MemberVerification.tsx` (all tracking-wider purged)
- [x] Refactored `Dashboard.tsx` (table headers and status normalized)
- [x] Refactored `Regions.tsx` (geographical labels normalized)
- [x] Refactored `Blogs.tsx` (categorization badges normalized)
- [x] Refactored `index.css` (global h5/h6 tracking neutralized)
- [x] Neutralized final residual tokens in `Settings.tsx`
- [x] Verified 100% compliance across all storefront and admin modules

## Current Architectural State: HARDENED
The platform now exhibits total typographic parity. Every label, status badge, and heading strictly follows the **General Rule**:
- **Case**: `normal-case` (Mandatory for readability)
- **Weight**: `font-bold` (Mandatory for interactive density)
- **Tracking**: `tracking-tight` (Mandatory for visual cohesion)

**Vigilance Note**: Any future UI contributions must be audited against these standards prior to deployment. The legacy `tracking-wider`, `tracking-widest`, and `uppercase` tokens have been formally deprecated and purged from the digital infrastructure.
