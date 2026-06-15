# KYC — Ghana Card upload + Smile ID verification

Status: **Phase 1 (upload + storage) to be built. Phase 2 (Smile ID) deferred until credentials are provided.**

This document is the implementation spec for wiring **Smile ID** verification once an
account + credentials exist. When ready, the activation prompt is simply:
_"Implement Smile ID per docs/kyc-smileid-integration.md — here are the credentials."_

---

## Product decisions (locked)

- **Documents collected:** Ghana Card **front**, Ghana Card **back**, and a **selfie**.
- **Verification product:** Smile ID **Enhanced KYC / Biometric KYC** — validates the
  Ghana Card **and** matches the selfie to the document holder (biometric liveness).
  (Document Verification alone validates the card; we want the biometric selfie match too.)
- **Trigger:** **auto-verify on upload** — as soon as the member submits all three
  images, verification fires automatically.
- **Admin-initiated:** an admin can also upload a member's documents on their behalf and
  trigger verification from the member detail page.

---

## Phase 1 — upload + storage (no Smile ID dependency)

Build this first; it is fully functional and testable without any Smile ID account.

### Storage

- Private bucket **`member-kyc`** (NOT public).
- Object path convention: `{authId}/ghana-card-front`, `{authId}/ghana-card-back`,
  `{authId}/selfie` (with the original extension).
- RLS on `storage.objects` for this bucket:
  - Member may insert/select/update/delete objects in **their own** folder
    (`(storage.foldername(name))[1] = auth.uid()::text`).
  - Admins (`is_admin()`) may select all (review) and insert (upload on behalf).

### Database — `member_kyc` (one row per member)

| column                  | type        | notes                                                                            |
| ----------------------- | ----------- | -------------------------------------------------------------------------------- |
| `user_id`               | uuid PK     | FK → `public.users.id`                                                           |
| `ghana_card_front_path` | text        | storage object path                                                              |
| `ghana_card_back_path`  | text        |                                                                                  |
| `selfie_path`           | text        |                                                                                  |
| `status`                | text        | `not_uploaded` \| `uploaded` \| `pending_verification` \| `verified` \| `failed` |
| `smile_job_id`          | text        | Phase 2 — Smile ID job reference                                                 |
| `smile_result`          | jsonb       | Phase 2 — raw verdict payload                                                    |
| `verified_at`           | timestamptz | set when status → verified                                                       |
| `updated_at`            | timestamptz | default now()                                                                    |

- RLS: member select/insert/update own row; admin select/update all.
- Grants: `select, insert, update` to `authenticated` (gated by RLS).

### UI

- **Member — ProfileSettings:** an "Identity verification" section with three uploads
  (front, back, selfie), a status pill, and re-upload support.
- **Admin — member detail Identity tab:** replace the hardcoded "Ghana Card not
  uploaded" KYC row with the real `member_kyc.status`; show document thumbnails/links
  (signed URLs), plus an admin upload-on-behalf control and a (Phase 1 manual / Phase 2
  automatic) verify action.

---

## Phase 2 — Smile ID wiring (deferred)

### Credentials (set as Supabase secrets — never commit)

```
SMILE_PARTNER_ID=...
SMILE_API_KEY=...
SMILE_ID_SERVER=0   # 0 = sandbox, 1 = production
SMILE_CALLBACK_URL=https://<project>.functions.supabase.co/smile-id-callback
```

### Edge functions to add

1. **`submit-kyc-verification`** (verify_jwt=true)
   - Derives the member from the JWT (never trust client id).
   - Loads the three images from the `member-kyc` bucket (service role).
   - Calls Smile ID **Enhanced KYC + Biometric** job (product code per Smile docs):
     - Partner params: a unique `job_id`, `user_id`.
     - ID info: country `GH`, id_type `GHANA_CARD`, plus the ID number
       (decrypt via `admin_get_national_id` RPC if used).
     - Images: ID front, ID back, selfie (base64 per Smile's image spec).
     - Signature: compute Smile's request signature from `SMILE_API_KEY` +
       `SMILE_PARTNER_ID` + timestamp (HMAC-SHA256, base64 — see Smile signature docs).
   - Persists `smile_job_id`, sets `status = pending_verification`.
2. **`smile-id-callback`** (verify_jwt=false — Smile posts here; validate signature instead)
   - Verifies the inbound signature.
   - Maps Smile's `ResultCode` / `Actions` to `verified` or `failed`, stores
     `smile_result`, sets `verified_at`, flips `users` verification status if appropriate.

### Wiring

- **Auto-trigger:** after a successful upload of all three images (member or admin),
  invoke `submit-kyc-verification`.
- **Status display:** member ProfileSettings + admin Identity tab read `member_kyc.status`.

### Activation checklist (when credentials arrive)

1. Set the four secrets above (`supabase secrets set ...`).
2. Deploy `submit-kyc-verification` and `smile-id-callback`.
3. Register `SMILE_CALLBACK_URL` in the Smile ID portal.
4. Flip the auto-trigger on after upload (Phase 1 ships with the trigger point stubbed).
5. Test in sandbox (`SMILE_ID_SERVER=0`) with Smile's test images, then switch to `1`.

### References

- Smile ID docs: https://docs.usesmileid.com (Enhanced KYC, Biometric KYC, signatures, callbacks)
- Existing patterns in this repo to mirror: `supabase/functions/capture-admin-device`
  (JWT-derived caller, IP/geo), `supabase/functions/kyc-verify`, `ocr-verify`.
