import { createContext, useContext, useEffect } from 'react'
import type React from 'react'

interface ITHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

interface ITLayoutContextValue {
  header: ITHeader
  setHeader: (h: ITHeader) => void
}

export const ITLayoutContext = createContext<ITLayoutContextValue>({
  header: { title: 'IT Department', icon: 'computer', description: '' },
  setHeader: () => {},
})

export function useITLayout(
  title: string,
  icon: string,
  description: string,
  actions?: React.ReactNode
) {
  const { setHeader } = useContext(ITLayoutContext)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setHeader({ title, icon, description, actions })
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */
}
