# National Production API Integration Guide

This document is the single source of truth for all third-party integrations required to bring The Base Movement platform to full national production. It covers current implementation status, provider options, integration steps, and code blueprints.

**Last audited:** 2026-05-30

---

## Integration Status Overview

| Integration                    | Status                                       | Remaining Work                                               |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------ |
| KYC / Identity Verification    | ⚠️ Infrastructure built, fetch commented out | Supply API credentials + uncomment fetch in `kyc-verify`     |
| Mapbox GL (GIS Maps)           | ✅ Complete                                  | `VITE_MAPBOX_TOKEN` configured in `.env` — no further action |
| SMS Gateway (Africa's Talking) | ✅ Live                                      | `AT_API_KEY` + `AT_USERNAME` set in Supabase secrets         |
| Email Dispatch (Resend)        | ✅ Live                                      | `RESEND_API_KEY` set in Supabase secrets                     |
| Push Notifications             | ✅ Live                                      | `send-push-notification` edge function active                |
| FastAPI ML Intelligence        | ⏳ Simulated locally                         | Deploy FastAPI service + wire endpoints                      |

---

## 1. Identity Verification (KYC/Biometrics)

**Purpose**: Automated validation of Ghana Cards, Passports, and real-time biometric face-matching during registration.

**Status**: `tacticalService.verifyMemberID` already routes to the `kyc-verify` Supabase Edge Function. The edge function reads `SMILE_ID_PARTNER_ID` and `SMILE_ID_API_KEY` from secrets and hard-fails if missing. The actual Smile Identity API fetch is **commented out at line 35** of `supabase/functions/kyc-verify/index.ts` pending credentials.

### Recommended Providers

| Provider                        | Regional Focus   | Capabilities                                                      |
| :------------------------------ | :--------------- | :---------------------------------------------------------------- |
| **Smile Identity** _(selected)_ | Africa (Primary) | ID Validation, Liveness Check, Face Match, AML Screening          |
| Onfido                          | Global           | AI-powered document verification & biometric analysis             |
| Sumsub                          | Global           | Automated KYC/KYB/KYT, Fraud detection, Legal entity verification |
| Shufti Pro                      | Global           | Real-time identity verification with 99% accuracy                 |

### Integration Steps

1. Create an account at [Smile Identity](https://smileidentity.com/).
2. Obtain your `SMILE_ID_PARTNER_ID` and `SMILE_ID_API_KEY`.
3. Add these to your Supabase Edge Function secrets via the Dashboard → Settings → Edge Function Secrets:
   - `SMILE_ID_PARTNER_ID`
   - `SMILE_ID_API_KEY`
4. **Implementation File**: `supabase/functions/kyc-verify/index.ts`
   - Locate the `PRO PRODUCTION LOGIC` section (line ~29).
   - Uncomment and complete the `fetch` POST request to `/v1/verify` using the `_imageBase64` and `_idNumber` payloads already extracted from the request body.

### Implementation Blueprint

```typescript
async function performKYCCheck(userId: string, idPhoto: string, selfie: string) {
  const response = await fetch('https://api.smileidentity.com/v1/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('SMILE_ID_API_KEY')}` },
    body: JSON.stringify({
      user_id: userId,
      job_type: 1, // Biometric Verification
      id_card_image: idPhoto,
      selfie_image: selfie,
    }),
  })

  const result = await response.json()

  // Map to TacticalService interface
  return {
    confidence: result.confidence_score,
    matches: result.match_details,
    flagged: result.result !== 'Verified',
  }
}
```

> **Note:** Use `Deno.env.get(...)` inside Edge Functions, not `process.env`.

---

## 2. Mapbox GL (GIS Maps)

**Purpose**: High-performance interactive national maps for Chapter hubs and Supply Chain logistics.

**Status**: ✅ **Complete.** Both `ChaptersMap.tsx` and `NationalSupplyChainMap.tsx` (via `LogisticsMap.tsx`) import from `react-map-gl/mapbox` and render live interactive maps. The static SVG placeholder has been removed. `VITE_MAPBOX_TOKEN` is configured in `.env` (2026-05-25).

> **Audit note (2026-05-25):** The original roadmap referenced `LogisticsIntelligence.tsx` — that file no longer exists. The map is now in `src/pages/admin/logisticsintelligence/NationalSupplyChainMap.tsx`.

### Integration Steps

1. Create an account at [Mapbox](https://www.mapbox.com/).
2. Generate a default public token.
3. Add the token to your local `.env` and production hosting environment variables:
   ```env
   VITE_MAPBOX_TOKEN=pk.eyJ1I...
   ```

### GIS Data Strategy (for future layer enhancements)

- `Warehouses`: Static markers with real-time inventory status
- `Transport Routes`: Polyline overlays showing mobilization velocity
- `Regional Hubs`: Heatmaps showing fulfillment density
- **Data Source**: GeoJSON endpoint via Supabase Edge Function

### Implementation Blueprint (current pattern in codebase)

```tsx
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const LogisticsMap = ({ inventoryData }) => {
  const warehouseGeoJSON = {
    type: 'FeatureCollection',
    features: inventoryData.map((item) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [item.lng, item.lat] },
      properties: { name: item.region, stock: item.stock_level },
    })),
  }

  return (
    <Map
      initialViewState={{ longitude: -1.0232, latitude: 7.9465, zoom: 6 }}
      style={{ width: '100%', height: 600 }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
    >
      <Source id="warehouses" type="geojson" data={warehouseGeoJSON}>
        <Layer {...layerStyle} />
      </Source>
    </Map>
  )
}
```

---

## 3. SMS Gateway — Africa's Talking

**Purpose**: Blast urgent operational directives and movement alerts to field agents and members via SMS.

**Status**: ✅ **Live.** Fully implemented and configured as of 2026-05-30. `AT_API_KEY` and `AT_USERNAME` (`tbmovement`) are set in Supabase Edge Function secrets. The dispatcher fires automatically for all **Urgent** broadcasts, batching up to 100 recipients per request and normalizing Ghanaian phone numbers.

### Secrets (set in Supabase Dashboard → Settings → Edge Function Secrets)

| Secret        | Value        | Notes                                |
| ------------- | ------------ | ------------------------------------ |
| `AT_API_KEY`  | `atsk_...`   | Africa's Talking API key             |
| `AT_USERNAME` | `tbmovement` | Registered Africa's Talking username |

### How It Works

**Implementation File**: `supabase/functions/broadcast-dispatcher/index.ts`

When a broadcast with `priority: "Urgent"` is triggered:

1. All users in the target `REGION` or `CONSTITUENCY` are fetched from the `users` table.
2. Phone numbers are normalized to E.164 format (`0XX...` → `+233XX...`, `233XX...` → `+233XX...`).
3. Numbers are batched in groups of 100 and sent via the Africa's Talking Messaging API.
4. Each batch result is logged to the edge function console.

### Implementation Blueprint (actual code in production)

```typescript
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+${digits}`
}

const numbers = phoneRecipients.map((u) => normalizePhone(u.phone_number as string)).filter(Boolean)

const AT_BATCH = 100
for (let i = 0; i < numbers.length; i += AT_BATCH) {
  const batch = numbers.slice(i, i + AT_BATCH)
  const params = new URLSearchParams({
    username: Deno.env.get('AT_USERNAME') ?? '',
    to: batch.join(','),
    message: body ?? subject ?? 'An urgent update from The Base Movement.',
  })
  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey: Deno.env.get('AT_API_KEY') ?? '',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const data = await res.json()
  console.warn(`[SMS] Batch ${i / AT_BATCH + 1}:`, JSON.stringify(data))
}
```

### Alternative Providers

| Provider | Regional Focus | Notes                       |
| :------- | :------------- | :-------------------------- |
| Twilio   | Global         | Higher cost, very reliable  |
| Hubtel   | Ghana-specific | Local short codes available |
| Arkesel  | Ghana/Africa   | Competitive local rates     |

---

## 4. Email Dispatch — Resend

**Purpose**: Send branded HTML emails to members for Urgent broadcasts.

**Status**: ✅ **Live.** `RESEND_API_KEY` is set in Supabase Edge Function secrets. Emails are sent via the `broadcast-dispatcher` edge function using the `broadcastEmail` template from `supabase/functions/_shared/email-templates.ts`, batched in groups of 50 (Resend's per-call limit).

### Secrets

| Secret           | Notes                                 |
| ---------------- | ------------------------------------- |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) |

### Sender Address

`The Base Movement <noreply@thebasemovement.com>`

> Ensure the domain `thebasemovement.com` is verified in your Resend account's DNS settings.

---

## 5. Push Notifications

**Purpose**: Real-time in-app and device push notifications for broadcasts and activity alerts.

**Status**: ✅ **Live.** The `send-push-notification` edge function is active. Push tokens are stored in the `push_subscriptions` table. `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` are set in Supabase secrets. The public key (`VITE_VAPID_PUBLIC_KEY`) is in `.env`.

> The broadcast dispatcher calls `send-push-notification` as a fire-and-forget for all Urgent broadcasts in addition to SMS and email.

---

## 6. FastAPI ML Intelligence

**Purpose**: Process demographic and feedback datasets to generate propensity modeling and national sentiment scores.

**Status**: ⏳ Currently simulated via `getSimulatedSentiment()` in `src/pages/FeedbackHub.tsx` (lines 17, 58, 70). No external ML service connected.

### Integration Steps

1. Deploy a Python FastAPI server (e.g., on Render, AWS, or DigitalOcean) with your ML models.
2. Configure the FastAPI server to read directly from the Supabase Postgres database.
3. **Implementation Files**:
   - `src/pages/FeedbackHub.tsx`: Replace `getSimulatedSentiment` with an API call to your FastAPI endpoint.
   - `src/services/intelligenceService.ts`: Replace Supabase direct-reads with FastAPI forecasting endpoints for complex computation.

### Suggested Models

- Time-series forecasting for member growth
- Sentiment classification (VADER or fine-tuned transformer) for feedback ingestion
- Propensity modeling for donor engagement

---

_Platform broadcast stack (SMS + Email + Push) is now fully operational as of 2026-05-30. Remaining production blockers: KYC credentials (Smile Identity) and ML intelligence (FastAPI deployment)._
