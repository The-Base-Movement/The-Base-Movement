# National Production API Integration Guide

This document is the single source of truth for all third-party integrations required to bring The Base Movement platform to full national production. It covers current implementation status, provider options, integration steps, and code blueprints.

**Last audited:** 2026-05-25

---

## Integration Status Overview

| Integration                 | Status                                                | Remaining Work                                                  |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| KYC / Identity Verification | ⚠️ Infrastructure built, fetch commented out          | Supply API credentials + uncomment fetch in `kyc-verify`        |
| Mapbox GL (GIS Maps)        | ✅ Fully implemented                                  | Supply `VITE_MAPBOX_TOKEN` only                                 |
| SMS Gateway                 | ⚠️ Infrastructure built, dispatcher halts before send | Supply provider key + implement fetch in `broadcast-dispatcher` |
| FastAPI ML Intelligence     | ⏳ Simulated locally                                  | Deploy FastAPI service + wire endpoints                         |

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
3. Add these to your Supabase Vault / Edge Function secrets:
   ```bash
   supabase secrets set SMILE_ID_PARTNER_ID=your_partner_id
   supabase secrets set SMILE_ID_API_KEY=your_api_key
   ```
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

**Status**: ✅ **Fully implemented.** Both `ChaptersMap.tsx` and `NationalSupplyChainMap.tsx` (via `LogisticsMap.tsx`) import from `react-map-gl/mapbox` and render live interactive maps. The static SVG placeholder has been removed. Supplying `VITE_MAPBOX_TOKEN` is the only remaining step.

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

## 3. SMS Gateway

**Purpose**: Blast urgent operational directives and movement alerts to field agents and members via SMS.

**Status**: Dispatcher infrastructure built in `supabase/functions/broadcast-dispatcher/index.ts`. Database query targets users correctly, but halts before dispatching — `// TODO: Integrate with real SMS provider` at line 48.

### Recommended Providers

| Provider                                       | Regional Focus                                |
| :--------------------------------------------- | :-------------------------------------------- |
| **Africa's Talking** _(recommended for Ghana)_ | Africa — competitive rates, Ghana short codes |
| Twilio                                         | Global — higher cost, very reliable           |

### Integration Steps

1. Create an account at [Africa's Talking](https://africastalking.com/) or [Twilio](https://www.twilio.com/).
2. Obtain your Account SID / API key and a registered Sender ID.
3. Add to your Supabase Edge Function secrets:
   ```bash
   supabase secrets set SMS_PROVIDER_KEY=your_api_key
   ```
4. **Implementation File**: `supabase/functions/broadcast-dispatcher/index.ts`
   - Locate the `// TODO: Integrate with real SMS provider` block (line ~48).
   - Implement the `fetch` POST request to your provider's REST API, iterating over the `recipients` array.

---

## 4. FastAPI ML Intelligence

**Purpose**: Process demographic and feedback datasets to generate propensity modeling and national sentiment scores.

**Status**: Currently simulated via `getSimulatedSentiment()` in `src/pages/FeedbackHub.tsx` (lines 17, 58, 70). No external ML service connected.

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

_Once these 4 integrations are wired up with their respective API keys and services, the platform is production-ready for national rollout._
