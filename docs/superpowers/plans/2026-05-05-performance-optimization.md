# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize "The Base" platform for low-bandwidth environments in Ghana.

**Architecture:** Implement TanStack Query for robust caching and background synchronization, alongside global asset optimization and a user-toggleable 'Low-Bandwidth Mode'.

**Tech Stack:** React, TypeScript, TanStack Query v5, Supabase, Tailwind CSS.

---

### Task 1: Foundation - Install and Setup TanStack Query

**Files:**
*   Modify: `package.json`
*   Modify: `src/main.tsx`

- [x] **Step 1: Install TanStack Query**
    Run: `npm install @tanstack/react-query`

- [x] **Step 2: Initialize QueryClient**
    Modify `src/main.tsx` to include the `QueryClientProvider`.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ChaptersProvider } from './context/ChaptersContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      networkMode: 'always',
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ChaptersProvider>
            <App />
          </ChaptersProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
```

- [x] **Step 3: Commit**
    ```bash
    git add package.json src/main.tsx
    git commit -m "perf: setup TanStack Query client"
    ```

---

### Task 2: Refactor ChaptersContext for On-Demand Loading

**Files:**
*   Modify: `src/context/ChaptersContext.tsx`

- [x] **Step 1: Replace manual state with useQuery**
    Modify `src/context/ChaptersContext.tsx` to use `useQuery`.

```tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { Chapter } from '@/types/admin'

interface ChaptersContextValue {
  chapters: Chapter[]
  isLoading: boolean
  refreshChapters: () => Promise<void>
  addChapter: (chapter: Omit<Chapter, 'id'>) => Promise<boolean>
  updateChapter: (id: string, patch: Partial<Chapter>) => Promise<boolean>
  deleteChapter: (id: string, name: string) => Promise<boolean>
}

const ChaptersContext = createContext<ChaptersContextValue | null>(null)

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data: chapters = [], isLoading, refetch } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => adminService.getChapters(),
  })

  const addMutation = useMutation({
    mutationFn: (chapter: Omit<Chapter, 'id'>) => adminService.createChapter(chapter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Chapter> }) => 
      adminService.updateChapter(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      adminService.deleteChapter(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  })

  return (
    <ChaptersContext.Provider value={{ 
      chapters, 
      isLoading, 
      refreshChapters: async () => { await refetch() },
      addChapter: (chapter) => addMutation.mutateAsync(chapter),
      updateChapter: (id, patch) => updateMutation.mutateAsync({ id, patch }),
      deleteChapter: (id, name) => deleteMutation.mutateAsync({ id, name })
    }}>
      {children}
    </ChaptersContext.Provider>
  )
}

export function useChapters() {
  const ctx = useContext(ChaptersContext)
  if (!ctx) throw new Error('useChapters must be used inside <ChaptersProvider>')
  return ctx
}
```

- [x] **Step 2: Commit**
    ```bash
    git add src/context/ChaptersContext.tsx
    git commit -m "perf: refactor ChaptersContext to use TanStack Query"
    ```

---

### Task 3: Global Image Optimization (Lazy Loading)

**Files:**
*   Batch Modify: All files containing `<img>` tags.

- [x] **Step 1: Apply native lazy loading to all images**
    Search for `<img` and add `loading="lazy" decoding="async"`.

- [x] **Step 2: Commit**
    ```bash
    git commit -m "perf: apply native lazy loading to all images"
    ```

---

### Task 4: Low-Bandwidth Mode Infrastructure

**Files:**
*   Create: `src/context/PerformanceContext.tsx`
*   Modify: `src/App.tsx`

- [x] **Step 1: Create PerformanceContext**
    Create `src/context/PerformanceContext.tsx`.

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PerformanceContextValue {
  lowBandwidthMode: boolean
  setLowBandwidthMode: (enabled: boolean) => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [lowBandwidthMode, setLowBandwidthMode] = useState(() => {
    return localStorage.getItem('low_bandwidth_mode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('low_bandwidth_mode', String(lowBandwidthMode))
  }, [lowBandwidthMode])

  return (
    <PerformanceContext.Provider value={{ lowBandwidthMode, setLowBandwidthMode }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export const usePerformance = () => {
  const ctx = useContext(PerformanceContext)
  if (!ctx) throw new Error('usePerformance must be used inside <PerformanceProvider>')
  return ctx
}
```

- [x] **Step 2: Update App.tsx to include PerformanceProvider**
    Wrap the app in `PerformanceProvider`.

- [x] **Step 3: Commit**
    ```bash
    git add src/context/PerformanceContext.tsx src/App.tsx
    git commit -m "feat: add PerformanceContext for low-bandwidth mode"
    ```

---

### Task 5: Conditional Rendering for Performance

**Files:**
*   Modify: `src/pages/Home.tsx`
*   Modify: `src/pages/Dashboard.tsx`

- [x] **Step 1: Optimize Home Hero**
    Use `usePerformance` to swap the heavy background image for a solid brand-green color or a lightweight gradient if `lowBandwidthMode` is active.

- [x] **Step 2: Optimize Dashboard Banners**
    Apply similar logic to `src/pages/Dashboard.tsx`.

- [x] **Step 3: Commit**
    ```bash
    git commit -m "perf: implement conditional rendering for low-bandwidth mode"
    ```

---

### Task 6: Settings Toggle

**Files:**
*   Modify: `src/pages/ProfileSettings.tsx`

- [x] **Step 1: Add the toggle UI**
    Add a Switch or Checkbox in `ProfileSettings.tsx` to toggle `lowBandwidthMode`.

- [x] **Step 2: Commit**
    ```bash
    git commit -m "feat: add low-bandwidth mode toggle to settings"
    ```
