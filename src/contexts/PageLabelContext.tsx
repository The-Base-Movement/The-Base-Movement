/**
 * @file PageLabelContext.tsx
 * @description Provides a global page title/label state that pages can update to dynamically display
 * their page title or category header in the layout navigation bar or header shell.
 */

import { createContext, useContext, useState } from 'react'

/**
 * Interface representing the Page Label Context Type
 */
interface PageLabelContextType {
  /** The current active label/title for the displayed page */
  currentLabel: string
  /** Updates the active page title/label */
  setCurrentLabel: (label: string) => void
}

const PageLabelContext = createContext<PageLabelContextType>({
  currentLabel: '',
  setCurrentLabel: () => {},
})

/**
 * Provider component for managing the dynamic header label/title of pages.
 *
 * @param props - Component props
 * @param props.children - Child elements to wrap with the PageLabelProvider
 */
export function PageLabelProvider({ children }: { children: React.ReactNode }) {
  const [currentLabel, setCurrentLabel] = useState('')
  return (
    <PageLabelContext.Provider value={{ currentLabel, setCurrentLabel }}>
      {children}
    </PageLabelContext.Provider>
  )
}

/**
 * Custom React hook to access or update the active page header label.
 *
 * @returns The PageLabel context value containing the current label and update action.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePageLabel = () => useContext(PageLabelContext)
