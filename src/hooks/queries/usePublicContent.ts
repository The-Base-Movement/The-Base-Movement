import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'

// Shared React Query hooks for public (unauthenticated) content. Multiple pages
// read the same data (Home, About, Blog) — going through these hooks means one
// cached fetch is reused across them and across revisits, instead of every page
// re-hitting Supabase on mount. staleTime inherits the 5-min default in main.tsx.
//
// Query-key convention: ['public', <resource>]. Follow this when extending
// caching to other read paths so keys stay predictable and easy to invalidate.

export function useBlogPosts() {
  return useQuery({
    queryKey: ['public', 'blogPosts'],
    queryFn: () => contentService.getBlogPosts(),
  })
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public', 'stats'],
    queryFn: () => adminService.getPublicStats(),
  })
}

export function useMilestones() {
  return useQuery({
    queryKey: ['public', 'milestones'],
    queryFn: () => adminService.getMilestones(),
  })
}

export function useActivePolls() {
  return useQuery({
    queryKey: ['public', 'polls'],
    queryFn: () => adminService.getPolls(),
  })
}
