# The Base - Platform Integration To-Do List

This document tracks the remaining tasks required to transition the platform from using mock data and artificial delays to a fully production-ready, database-backed application using Supabase.

## 🛒 Storefront & Transactions
- [x] **Shopping Cart Persistence**: Update `StoreProvider.tsx` to persist the `cart` state to `localStorage` (or Supabase) so it survives page refreshes.
- [x] **Order Submission**: Update `Checkout.tsx` to insert completed transactions, shipping details, and order lines into a `store_orders` Supabase table instead of just navigating away.

## 👥 Member & Admin Dashboards
- [x] **Member Dashboard Metrics**: Remove the artificial 800ms delay in `Dashboard.tsx` and replace hardcoded metrics with real aggregations from the user's data.
- [x] **Chapters Integration**: Remove the artificial 1500ms delay in `Chapters.tsx`. Ensure `adminService.ts` correctly fetches chapters without falling back to mock data.
- [x] **Growth Trends**: Create the `membership_growth_view` in the Supabase database so that `getGrowthTrends()` can execute successfully.

## 📊 Tactical Intelligence & Command (Phase 13/14)
- [x] **War Room Seeding**: Populated `crisis_incidents` and `rapid_response_directives` with high-fidelity telemetry.
- [x] **Ground Game Seeding**: Initialized `canvassing_campaigns` and `canvasser_logs` for national outreach.
- [x] **Admin Identity Sync**: Aligned `auth.users` with `public.admins` for referential integrity.

## 📰 Content Management
- [x] **Blog Post Types**: Hardened `BlogPost` interface and redirected imports to `@/types/admin`.
- [x] **Blog Fetching**: Update `BlogPost.tsx` to fetch actual post content from the `blog_posts` table based on the URL slug.
- [x] **Editorial Author Directory**: Built the `Authors.tsx` view with live data fetching, soft-delete functionality, and UI parity.
- [x] **Author Creation/Editing**: Created `EditAuthor.tsx` with high-fidelity inputs, photo upload simulation, and strict dependency management.
- [x] **Administrative Navigation**: Replaced hardcoded breadcrumbs with the global `<Breadcrumbs />` component across the command center.

## 📑 Documentation Governance (Phase 15)
- [x] **Consolidate Root Docs**: Sync artifacts from `brain/` to project `docs/` folder.
- [x] **Legacy Cleanup**: Remove redundant or outdated `.md` files in subdirectories to prevent "Roadmap Drift".
- [x] **Master Update Protocol**: Enforce all future updates to occur in the root `docs/` master files.
