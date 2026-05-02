import { createContext, useContext, useState, type ReactNode } from 'react'
import { allChapters } from '@/data/chaptersData'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Chapter {
  id: string
  name: string
  city_or_region: string
  country: string
  members: number | null
  membersCount: number
  status: string
  details_url: string
  description: string
}

interface ChaptersContextValue {
  chapters: Chapter[]
  addChapter: (chapter: Omit<Chapter, 'id' | 'membersCount'>) => void
  updateChapter: (id: string, patch: Partial<Chapter>) => void
  deleteChapter: (id: string) => void
}

// ── Context ────────────────────────────────────────────────────────────────────
const ChaptersContext = createContext<ChaptersContextValue | null>(null)

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>(allChapters as Chapter[])

  const addChapter = (chapter: Omit<Chapter, 'id' | 'membersCount'>) => {
    const id = chapter.name
      .toLowerCase()
      .replace(/ - /g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
    setChapters(prev => [
      { ...chapter, id, membersCount: chapter.members ?? 0 },
      ...prev,
    ])
  }

  const updateChapter = (id: string, patch: Partial<Chapter>) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const deleteChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id))
  }

  return (
    <ChaptersContext.Provider value={{ chapters, addChapter, updateChapter, deleteChapter }}>
      {children}
    </ChaptersContext.Provider>
  )
}

export function useChapters() {
  const ctx = useContext(ChaptersContext)
  if (!ctx) throw new Error('useChapters must be used inside <ChaptersProvider>')
  return ctx
}
