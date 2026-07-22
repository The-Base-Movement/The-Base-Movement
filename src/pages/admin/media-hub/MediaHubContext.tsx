import { createContext, useContext, useEffect, useRef } from 'react'
import type React from 'react'

interface MediaHubHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

interface MediaHubContextValue {
  header: MediaHubHeader
  setHeader: (h: MediaHubHeader) => void
}

export const MediaHubContext = createContext<MediaHubContextValue>({
  header: { title: 'Media Hub', icon: 'newsmode', description: '' },
  setHeader: () => {},
})

export function useMediaHubLayout(
  title: string,
  icon: string,
  description: string,
  actions?: React.ReactNode
) {
  const { setHeader } = useContext(MediaHubContext)
  // `actions` is usually inline JSX — a new element object on every render. With
  // it in the header effect's deps, setHeader ran every render → the layout
  // re-rendered → children re-rendered → new inline `actions` → an infinite
  // render loop that froze the page and blocked route changes (URL updated but
  // the page didn't switch). Keep the latest `actions` in a ref (updated in its
  // own effect, not during render) and push the header only when the page itself
  // (title/icon/description) changes.
  const actionsRef = useRef(actions)
  useEffect(() => {
    actionsRef.current = actions
  }, [actions])
  useEffect(() => {
    setHeader({ title, icon, description, actions: actionsRef.current })
  }, [title, icon, description, setHeader])
}
