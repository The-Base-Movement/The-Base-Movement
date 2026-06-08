# Forms Workflow

## Purpose

Adding or modifying form fields, validation, submission logic, and multi-step form flows in The Base Movement platform.

## When to use

Use this workflow when the task involves:

- Adding a new field to an existing form
- Changing validation rules (Zod schema or manual checks)
- Modifying a multi-step registration or onboarding form
- Fixing a form submission bug
- Adding or editing an admin CRUD form (member, chapter, poll, job, etc.)
- Modifying the registration flow (ChoiceStep → platform detection → steps 1–4 → Supabase insert)

## Project context

- Form library: React Hook Form + Zod (`react-hook-form@7`, `zod@4`, `@hookform/resolvers`)
- Registration flow: `src/pages/Register.tsx` + `src/services/registrationService.ts`
- Admin registration form: `src/components/admin/RegistrationForm.tsx` + constants + progress
- Multi-step state: managed locally within the form component, NOT in global state
- PDF/OCR scan-to-fill: `src/lib/scanForm.ts` (Tesseract + PDF.js)
- Platform detection: `detectPlatform()` in `src/lib/scanForm.ts`
- Avatar uploads: Supabase storage, flat bucket, named by reg number
- Form types: `src/types/registration.ts` (RegistrationFormData, RegistrationState)
- Admin CRUD forms: inline in the admin page file or in the matching subdirectory

## Inspect first

- The specific page/component file containing the form
- `src/types/registration.ts` — for registration form types
- `src/services/registrationService.ts` — for registration data submission
- `src/components/admin/RegistrationForm.tsx` — for admin-initiated registration
- `src/components/admin/RegistrationForm.constants.ts` — for field definitions
- Grep the relevant service file for the submit/update function

## Docs to check

- not available for forms specifically

## Avoid touching

- `src/routes.tsx` — form changes do not affect routing
- `supabase/migrations/` — unless a new DB column is needed for the new field
- Other forms that are not the target of the change

## Workflow

1. Read CLAUDE.md for form styling rules (inline styles, border-box, Public Sans).
2. Identify the specific form component file.
3. For registration flow: check `src/types/registration.ts` first for the data shape.
4. Add the field to the Zod schema first, then to the JSX.
5. Keep `boxSizing: 'border-box'` on all inputs.
6. Use `hsl(var(--border))` for input borders, `var(--radius-xs)` for input border-radius.
7. For new DB fields: add a migration with `GRANT SELECT` if it's on `public.users`.
8. Run `npm run typecheck`.
9. Summarize changed files.

## Project rules

- Always `boxSizing: 'border-box'` on inputs.
- Input border-radius: `var(--radius-xs)` (2px).
- Multi-step form state lives locally in the component — do not lift to global context.
- New `public.users` columns need GRANT SELECT (see CLAUDE.md Database Security Notes).
- Never call Supabase directly from form components — go through `src/services/`.
- Scan-to-fill (OCR) runs through `src/lib/scanForm.ts` — do not duplicate OCR logic.

## Validation

```bash
npm run typecheck
```

## Token-saving behavior

- Read only the form component file and relevant service function.
- Grep `registrationService.ts` for the insert function rather than reading the whole file.
- Do not scan unrelated form components.
- Stop after the form change is complete.
