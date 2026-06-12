# 📱 SMS Mobilization Implementation: Technical TODO

To operationalize the "Urgent" mobilization dispatch and "Lead Notifications," the following technical steps are required to move from simulation to real-world SMS delivery.

## 🏗️ 1. Provider Integration
- [ ] **Select SMS Gateway**: Choose a high-reliability provider for Ghana and Diaspora regions (e.g., **Twilio**, **Arkesel**, or **Hubtel**).
- [ ] **Provision Shortcode/Sender ID**: Register "THE BASE" or "THEBASE" as a verified alpha-numeric Sender ID to ensure high deliverability and brand recognition.
- [ ] **Configure API Keys**: Add provider credentials to Supabase Vault:
  ```bash
  supabase secrets set SMS_PROVIDER_API_KEY=your_key
  supabase secrets set SMS_SENDER_ID=THEBASE
  ```

## 📡 2. Edge Function Development
- [ ] **Implement `sendSms` Helper**: Create a utility function in `supabase/functions/shared/sms.ts` to handle the HTTP request to the selected provider.
- [ ] **Update `broadcast-dispatcher`**: Replace the simulation log with the real provider call:
  ```typescript
  const response = await sendSms(recipients, messageContent);
  ```
- [ ] **Update `notify-leads`**: Integrate real-time SMS alerts for chapter leads when new members join their specific jurisdiction.

## 🛡️ 3. Deliverability & Compliance
- [ ] **Regional Routing**: Implement routing logic to handle local Ghana numbers vs. international diaspora numbers (ensuring correct prefix handling).
- [ ] **Opt-Out Logic**: Ensure all automated mobilization SMS include an "Opt-Out" mechanism to comply with regional data privacy standards.
- [ ] **Rate Limiting**: Implement a queueing system if the mobilization blast exceeds provider TPS (Transactions Per Second) limits.

## 📊 4. Monitoring
- [ ] **Delivery Status Callbacks**: Set up a Supabase Edge Function to receive webhooks from the SMS provider for real-time delivery tracking.
- [ ] **Failure Alerting**: Configure an alert for admins if the SMS delivery failure rate exceeds 5% in any specific region.

---
**Status**: `PENDING_INTEGRATION` | **Target**: `Phase 6 Deployment`
