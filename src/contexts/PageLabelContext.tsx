import { createContext, useContext, useState } from 'react'

interface PageLabelContextType {
  currentLabel: string
  setCurrentLabel: (label: string) => void
}

const PageLabelContext = createContext<PageLabelContextType>({
  currentLabel: '',
  setCurrentLabel: () => {},
})

export function PageLabelProvider({ children }: { children: React.ReactNode }) {
  const [currentLabel, setCurrentLabel] = useState('')
  return (
    <PageLabelContext.Provider value={{ currentLabel, setCurrentLabel }}>
      {children}
    </PageLabelContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePageLabel = () => useContext(PageLabelContext)
