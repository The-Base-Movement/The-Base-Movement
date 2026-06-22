/**
 * @file ChaptersContext.tsx
 * @description Provides context for movement chapters (both regional and diaspora chapters).
 * Utilizes TanStack Query for caching and mutations, exposing methods to query, add, update, and delete chapters.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { Chapter } from '@/types/admin'

/**
 * Interface representing the Chapters Context Value
 */
interface ChaptersContextValue {
  /** Array of chapters retrieved from the service */
  chapters: Chapter[]
  /** Indicates if chapters are currently loading */
  isLoading: boolean
  /** Force refetches chapter data from the server */
  refreshChapters: () => Promise<void>
  /** Creates a new chapter */
  addChapter: (chapter: Omit<Chapter, 'id'>) => Promise<boolean>
  /** Updates details of a specific chapter */
  updateChapter: (id: string, patch: Partial<Chapter>) => Promise<boolean>
  /** Deletes a specific chapter */
  deleteChapter: (id: string, name: string) => Promise<boolean>
}

// ── Context ────────────────────────────────────────────────────────────────────
const ChaptersContext = createContext<ChaptersContextValue | null>(null)

/**
 * Provider component for managing chapters.
 * Coordinates TanStack Query query/mutation pipelines for chapters data management.
 *
 * @param props - Component props
 * @param props.children - Child elements to render inside the provider
 */
export function ChaptersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Use TanStack Query for chapters
  const {
    data: chapters = [],
    isLoading,
    refetch,
  } = useQuery({
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

/**
 * Custom React hook to access chapters management context.
 * Must be used within a ChaptersProvider.
 *
 * @returns The chapters context state and actions.
 * @throws Error if used outside of a ChaptersProvider.
 */
export function useChapters() {
  const ctx = useContext(ChaptersContext)
  if (!ctx) throw new Error('useChapters must be used inside <ChaptersProvider>')
  return ctx
}
