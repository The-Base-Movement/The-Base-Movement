import { useQuery } from '@tanstack/react-query'
import { contentService } from '@/services/contentService'
import { publicSiteService } from '@/services/publicSiteService'
import { tacticalService } from '@/services/tacticalService'
import { pollService } from '@/services/pollService'

const STALE_15_MIN = 1000 * 60 * 15

export function useBlogPosts() {
  return useQuery({
    queryKey: ['public', 'blogPosts'],
    queryFn: () => contentService.getBlogPosts(),
    staleTime: STALE_15_MIN,
  })
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public', 'stats'],
    queryFn: () => publicSiteService.getPublicStats(),
    staleTime: STALE_15_MIN,
  })
}

export function useMilestones() {
  return useQuery({
    queryKey: ['public', 'milestones'],
    queryFn: () => tacticalService.getMilestones(),
    staleTime: STALE_15_MIN,
  })
}

export function useActivePolls() {
  return useQuery({
    queryKey: ['public', 'polls'],
    queryFn: () => pollService.getPolls(),
    staleTime: STALE_15_MIN,
  })
}
