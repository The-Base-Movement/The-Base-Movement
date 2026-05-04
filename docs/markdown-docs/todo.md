# The Base: Strategic Expansion Roadmap (Post-Phase 4)

This TODO list outlines the next strategic horizons for the movement's platform expansion, focusing on field mobilization, resource logistics, and member engagement.

## 1. Communication Engine (Field Mobilization)
- [ ] **Automated Broadcast Hub**: Implement the service layer for bulk SMS/Email regional mobilization.
- [ ] **Mobilization Templates**: Create brand-synchronized message templates for HQ, Regional, and Constituency levels.
- [ ] **Urgent Alert Protocol**: Develop a "Level Red" notification system for immediate field intervention.
- [ ] **Engagement Tracking**: Integrate read-receipt and response telemetry into the Dashboard.

## 2. Resource Logistics (Merchandise & Materials)
- [ ] **National Inventory Vault**: Build the administrative module for tracking official movement assets (Tees, Caps, Flyers).
- [ ] **Regional Fulfillment Workflow**: Implement the request-and-verify system for regional resource allocation.
- [ ] **Stock Intelligence**: Integrate low-inventory alerts into the Command Center (Red status when critical).
- [ ] **Logistics Audit**: Track all material distributions with 100% accountability in the Audit Hub.

## 3. Member Portal 2.0 (Engagement Hub)
- [ ] **Gamified Mobilization**: Implement dynamic badges and "Movement Points" for active field participation.
- [ ] **Regional Leaderboards**: Create high-fidelity visualizations of regional mobilization strength to foster healthy chapter competition.
- [ ] **Digital ID 2.0**: Enhance the membership card with a scanable QR code for secure field event check-ins.
- [ ] **Interactive Roadmap**: Provide members with a real-time viewport into the movement's national milestones.

## 4. Technical Hardening & Scale
- [x] **Database Hardening**: Fix Supabase PostgREST array formatting (`400 Bad Request`) and resolve recursive RLS policy loops (`500 Internal Server Error`) on the `admins` table.
- [x] **Performance Optimization**: Implement dynamic, responsive pagination for the Chapters network grid to prevent DOM overload.
- [ ] **Advanced RLS Policies**: Refine Row Level Security for multi-tenant regional data isolation.
- [ ] **Image Optimization Pipeline**: Implement high-fidelity cropping and processing for member-uploaded chapter photos.
- [ ] **System Pulse Telemetry**: Develop a live "Health Check" dashboard for real-time API monitoring.

## 5. Storefront & Transactions (Immediate)
- [ ] **Order Submission**: Update `Checkout.tsx` to insert completed transactions, shipping details, and order lines into a `store_orders` Supabase table.

## 6. Dashboard & Database Integrations (Immediate)
- [ ] **Member Dashboard Metrics**: Replace hardcoded metrics with real aggregations in `Dashboard.tsx`.
- [ ] **Growth Trends**: Create the `membership_growth_view` in the database so `getGrowthTrends()` executes successfully.
- [ ] **Member Verification**: Transition `admin/MemberVerification.tsx` to pull pending verifications directly from Supabase.
- [ ] **Polls & Surveys**: Update `admin/Polls.tsx` and `adminService.ts` to fully integrate with the `polls` and `poll_options` tables, removing mock fallbacks.
- [ ] **Blog Posts**: Update `BlogPost.tsx` to fetch actual post content from the `blog_posts` table based on the URL slug.

---
*Absolute Integrity. Absolute Precision. The Base.*
