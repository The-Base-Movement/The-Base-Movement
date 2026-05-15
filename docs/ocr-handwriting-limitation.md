# Known Issue: OCR Scan Accuracy with Poor Handwriting

## Summary

The "Upload Scanned Form" feature on the registration page uses **Tesseract.js**, a browser-based OCR (Optical Character Recognition) engine that runs entirely in the browser with no server calls or API keys. While it works well on printed or typed text, it degrades significantly when registration forms are filled in by hand — especially with unclear, inconsistent, or stylised handwriting.

---

## What Happens

When a user uploads a scanned physical form:

1. Tesseract.js reads the image and converts it to raw text
2. Regex extractors search that text for known labels (e.g. `Full Name:`, `Region:`, `Phone:`)
3. Matched values are merged into the registration form for the user to review

When handwriting is poor, one or more of the following happens:

| Problem | Example | Result |
|---|---|---|
| Letter misread | `Kwame` → `Kwarne` or `Kw4me` | Wrong name pre-filled |
| Word skipped entirely | Name line not recognised | Field left blank |
| Label not found | `Full Name:` misread as `FuII Name` | Extractor finds nothing, field blank |
| Numbers garbled | `0244123456` → `O244l2345G` | Phone fails format check, discarded |
| Mixed garbage | Multiple lines bleed together | Extractor picks wrong field's value |

---

## Why It Happens

Tesseract.js is trained primarily on **printed fonts**. It was not designed for freehand handwriting recognition. Its accuracy degrades with:

- **Inconsistent letter sizing** — characters that vary in height confuse the character segmenter
- **Connected/cursive letters** — Tesseract expects clearly separated characters
- **Low contrast** — pencil, faded ink, or forms filled on crumpled paper
- **Non-standard character forms** — regional handwriting conventions (e.g. European `7` with a crossbar, looped `l`)
- **Low-resolution scans or phone photos** — anything below ~150 DPI produces noisy input

---

## Current Mitigation

The following safeguards are already in place:

- **Contextual toast feedback** — instead of always showing "success", the toast varies:
  - 0 fields extracted → orange warning: *"Nothing could be read — please fill in your details manually."*
  - 1–3 fields → blue info: *"Partially read — please review and complete the remaining fields."*
  - 4+ fields → green success: *"Form scanned — please review and complete your details."*
- **Sanitisation** — extracted phone numbers with fewer than 7 digits are discarded; invalid emails are dropped; all strings are trimmed
- **User review step** — the form is always shown to the user before submission; nothing is auto-submitted from scan results

These safeguards mean a bad scan **cannot create a corrupt member record** — the user always sees what was extracted and can correct or fill in what's missing.

---

## What Is NOT Handled

- **Silently wrong values** — a misread name that still looks plausible (e.g. `Kofi` → `Koti`) passes through as-is. The user must catch this during review.
- **Wrong field mapping** — if OCR text runs across line boundaries, a value might be extracted under the wrong label (e.g. address text appearing as the name).
- **Platform misdetection** — if the form header ("GHANA NETWORK" / "DIASPORA NETWORK") is handwritten rather than printed, `detectPlatform()` may default to Ghana incorrectly.

---

## Recommendations for Users

Admins distributing physical forms should advise members to:

1. **Print clearly in block/capital letters** — Tesseract handles printed caps far better than cursive
2. **Use a dark ballpoint pen** — avoid pencil, light ink, or felt-tip that bleeds
3. **Scan at high resolution** — phone camera photos work if taken in good lighting, flat surface, no shadows
4. **Fill in the printed form fields, not around them** — writing outside the field boundaries can cause OCR to blend label and value text

---

## Possible Future Improvements

| Option | Cost | Accuracy Gain |
|---|---|---|
| Switch to Google Cloud Vision API | Paid per scan | High — purpose-built for handwriting |
| Switch to Azure AI Document Intelligence | Paid per scan | Very high — form-aware, field extraction built in |
| Use Anthropic Claude vision (claude-sonnet-4-6) | API key required | High — can reason about ambiguous text |
| Add a manual field-by-field confirmation step post-scan | Free, no API | Catches wrong values before submission |
| Pre-process image (contrast boost, deskew) before OCR | Free, in-browser | Moderate — helps with faded/angled scans |

> **Note:** API-based options were explicitly ruled out during development due to cost concerns. The current Tesseract.js implementation is intentionally zero-cost. Any future upgrade must be evaluated against the project's no-paid-API policy.

---

## Related Files

- `src/lib/scanForm.ts` — OCR pipeline (Tesseract.js + PDF.js), field extractors, sanitisation
- `src/pages/Register.tsx` → `handleFormScan()` — entry point, toast logic
- `src/pages/register/components/ChoiceStep.tsx` — upload UI, scanning spinner
- `.claude/agents/registration-flow-docs.md` — full registration pipeline documentation
