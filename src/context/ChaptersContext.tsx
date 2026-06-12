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

// ── Context ────────────────────────────────────────────────────────────────────
const ChaptersContext = createContext<ChaptersContextValue | null>(null)

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Use TanStack Query for chapters
  const { data: chapters = [], isLoading, refetch } = useQuery({
    queryKey: ['chapters'],
    queryFn: () => adminService.getChapters(),
  })

  // Mutations
  const addChapterMutation = useMutation({
    mutationFn: (chapter: Omit<Chapter, 'id'>) => adminService.createChapter(chapter),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['chapters'] })
      }
    },
  })

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Chapter> }) =>
      adminService.updateChapter(id, patch),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['chapters'] })
      }
    },
  })

  const deleteChapterMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      adminService.deleteChapter(id, name),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['chapters'] })
      }
    },
  })

  const refreshChapters = async () => {
    await refetch()
  }

  const addChapter = async (chapter: Omit<Chapter, 'id'>) => {
    try {
      return await addChapterMutation.mutateAsync(chapter)
    } catch (error) {
      console.error('[ChaptersContext] Failed to add chapter:', error)
      return false
    }
  }

  const updateChapter = async (id: string, patch: Partial<Chapter>) => {
    try {
      return await updateChapterMutation.mutateAsync({ id, patch })
    } catch (error) {
      console.error('[ChaptersContext] Failed to update chapter:', error)
      return false
    }
  }

  const deleteChapter = async (id: string, name: string) => {
    try {
      return await deleteChapterMutation.mutateAsync({ id, name })
    } catch (error) {
      console.error('[ChaptersContext] Failed to delete chapter:', error)
      return false
    }
  }

  return (
    <ChaptersContext.Provider
      value={{
        chapters,
        isLoading,
        refreshChapters,
        addChapter,
        updateChapter,
        deleteChapter,
      }}
    >
      {children}
    </ChaptersContext.Provider>
  )
}

export function useChapters() {
  const ctx = useContext(ChaptersContext)
  if (!ctx) throw new Error('useChapters must be used inside <ChaptersProvider>')
  return ctx
}
