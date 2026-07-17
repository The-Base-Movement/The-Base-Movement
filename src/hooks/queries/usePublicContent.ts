import { useQuery } from '@tanstack/react-query'
import { contentService } from '@/services/contentService'
import { publicSiteService } from '@/services/publicSiteService'
import { tacticalService } from '@/services/tacticalService'
import { pollService } from '@/services/pollService'

export function useBlogPosts() {
  return useQuery({
    queryKey: ['public', 'blogPosts'],
    queryFn: () => contentService.getBlogPosts(),
  })
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public', 'stats'],
    queryFn: () => publicSiteService.getPublicStats(),
  })
}

export function useMilestones() {
  return useQuery({
    queryKey: ['public', 'milestones'],
    queryFn: () => tacticalService.getMilestones(),
  })
}

export function useActivePolls() {
  return useQuery({
    queryKey: ['public', 'polls'],
    queryFn: () => pollService.getPolls(),
  })
}
