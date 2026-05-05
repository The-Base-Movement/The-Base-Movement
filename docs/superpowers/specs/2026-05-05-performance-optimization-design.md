# Design Spec: Performance Optimization for Low-Bandwidth Environments

**Date**: 2026-05-05
**Status**: Approved
**Target Phase**: Operational Mobilization

## 1. Executive Summary
This spec outlines the technical strategy to optimize "The Base" platform for Ghana-specific network constraints. The goal is to minimize data consumption, reduce initial load times, and provide a resilient user experience even during network instability.

## 2. Data Fetching Architecture (TanStack Query)
We will replace manual `useEffect` fetching with **TanStack Query (v5)** to provide a robust caching and synchronization layer.

### Key Features:
- **Centralized Query Client**: Configured with `staleTime: 300000` (5 mins) and `retry: 3`.
- **Background Synchronization**: Data will refresh in the background when the user returns to the tab, but the UI will serve cached data instantly.
- **Offline Resilience**: Using `networkMode: 'always'` to allow cache reads when the connection is spotty.
- **Refactored Contexts**: Transition `ChaptersContext` and `StoreProvider` to use query hooks, preventing eager loading of all data on app mount.

## 3. Asset & Image Optimization
Media is currently the largest contributor to bundle and network weight.

### Key Features:
- **Native Lazy Loading**: Add `loading="lazy"` and `decoding="async"` to all `<img>` tags.
- **WebP Transition**: Convert high-traffic assets (`/logo.png`, `/hero-bg.png`, `/the-base-banner-1.png`) to WebP.
- **Placeholder Pattern**: Use low-quality image placeholders (LQIP) or CSS blur-up effects to improve perceived performance.
- **Low-Bandwidth Mode**: A user-toggleable setting to skip loading heavy decorative assets (Hero banners, video backgrounds).

## 4. Bundle & Code Optimization
- **Route-Based Splitting**: Audit `App.tsx` to ensure `lazy()` is utilized for all non-critical paths (completed).
- **Dependency Audit**: Review heavy libraries (like `jspdf`, `html2canvas`) and ensure they are only loaded when the specific feature is triggered (dynamic imports).

## 5. Success Criteria
- **Lighthouse Performance Score**: > 80 on Mobile (simulated Slow 4G).
- **First Contentful Paint (FCP)**: < 1.5s on 4G.
- **Data Transfer**: 30% reduction in total data transferred during a typical "Browse & Register" session.
