# 🔌 National Production API Integration Guide

This document outlines the final third-party Application Programming Interfaces (APIs) required to transition The Base Movement platform from its stabilized UI/UX state to a fully functional national production environment.

The frontend engineering, data models, and edge function infrastructures are completely built. To activate them, you must supply the production API keys and configure the final network requests.

---

## 1. Smile Identity (Live KYC & Biometrics)

**Purpose**: Automated validation of Ghana Cards, Passports, and real-time biometric face-matching during registration.
**Status**: Infrastructure built (Supabase Edge Function `kyc-verify` and `tacticalService.ts`), mock mode has been removed.

### Integration Steps:

1. Create an account at [Smile Identity](https://smileidentity.com/).
2. Obtain your `SMILE_ID_PARTNER_ID` and `SMILE_ID_API_KEY`.
3. Add these to your Supabase Vault / Edge Function secrets:
   ```bash
   supabase secrets set SMILE_ID_PARTNER_ID=your_partner_id
   supabase secrets set SMILE_ID_API_KEY=your_api_key
   ```
4. **Implementation File**: `supabase/functions/kyc-verify/index.ts`
   - Locate the `PRO PRODUCTION LOGIC` section.
   - Implement the `fetch` POST request to the Smile ID `/v1/verify` endpoint using the `_imageBase64` and `_idNumber` payloads already extracted from the request.

---

## 2. Mapbox GL (GIS Logistics Layer)

**Purpose**: Render high-performance, dynamic, and interactive national maps for Chapter hubs and Supply Chain logistics instead of static SVGs.
**Status**: Fully implemented. Both `LogisticsMap.tsx` and `ChaptersMap.tsx` are rendering high-fidelity interactive maps via `react-map-gl/mapbox`. The static SVG has been removed.

### Integration Steps:

1. Create an account at [Mapbox](https://www.mapbox.com/).
2. Generate a default public token.
3. Add the token to your local `.env` and production Vercel/hosting environment variables:
   ```env
   VITE_MAPBOX_TOKEN=pk.eyJ1I...
   ```
4. ~~**Implementation File**: `src/pages/admin/chapters/ChaptersMap.tsx`~~ — **Already done.** Both `ChaptersMap.tsx` and `LogisticsMap.tsx` import from `react-map-gl/mapbox` and render live interactive maps. No code changes needed — supplying `VITE_MAPBOX_TOKEN` is the only remaining step.

---

## 3. Twilio or African's Talking (SMS Gateway)

**Purpose**: Blast urgent operational directives and movement alerts to field agents and members via SMS.
**Status**: Dispatcher infrastructure built. Database query targets users correctly, but halts before dispatching the actual SMS.

### Integration Steps:

1. Create an account at [Twilio](https://www.twilio.com/) or [African's Talking](https://africastalking.com/).
2. Obtain your Account SID, Auth Token, and a registered Sender ID.
3. Add these to your Supabase Edge Function secrets:
   ```bash
   supabase secrets set SMS_PROVIDER_KEY=your_api_key
   ```
4. **Implementation File**: `supabase/functions/broadcast-dispatcher/index.ts`
   - Locate the `// TODO: Integrate with real SMS provider` comment block.
   - Implement the `fetch` POST request to your SMS provider's REST API, iterating over the `recipients` array.

---

## 4. Custom Python/FastAPI Microservice (ML Intelligence)

**Purpose**: Process massive demographic and feedback datasets to generate propensity modeling and national sentiment scores.
**Status**: Currently simulated via `getSimulatedSentiment()` local functions.

### Integration Steps:

1. Deploy a Python FastAPI server (e.g., on Render, AWS, or DigitalOcean) hosting your machine learning models (like VADER sentiment analysis or custom TensorFlow propensities).
2. Configure the FastAPI server to read directly from the Supabase Postgres Database.
3. **Implementation Files**:
   - `src/pages/FeedbackHub.tsx`: Replace the local `getSimulatedSentiment` function with an API call to your FastAPI service endpoint.
   - `src/services/intelligenceService.ts`: Replace Supabase direct-reads with API calls to your FastAPI forecasting endpoints if complex computation is required.

---

_Once these 4 integrations are wired up with their respective API keys, the platform is 100% complete for the national rollout._
