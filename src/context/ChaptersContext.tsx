import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { adminService, type Chapter } from '@/services/adminService'

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
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshChapters = async () => {
    setIsLoading(true)
    const data = await adminService.getChapters()
    setChapters(data)
    setIsLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    adminService.getChapters().then(data => {
      if (!cancelled) {
        setChapters(data)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const addChapter = async (chapter: Omit<Chapter, 'id'>) => {
    const success = await adminService.createChapter(chapter)
    if (success) await refreshChapters()
    return success
  }

  const updateChapter = async (id: string, patch: Partial<Chapter>) => {
    const success = await adminService.updateChapter(id, patch)
    if (success) await refreshChapters()
    return success
  }

  const deleteChapter = async (id: string, name: string) => {
    const success = await adminService.deleteChapter(id, name)
    if (success) await refreshChapters()
    return success
  }

  return (
    <ChaptersContext.Provider value={{ chapters, isLoading, refreshChapters, addChapter, updateChapter, deleteChapter }}>
      {children}
    </ChaptersContext.Provider>
  )
}

export function useChapters() {
  const ctx = useContext(ChaptersContext)
  if (!ctx) throw new Error('useChapters must be used inside <ChaptersProvider>')
  return ctx
}
