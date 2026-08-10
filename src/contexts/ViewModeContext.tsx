import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ViewModeContextType {
  effectiveRole: 'user' | 'restaurant'
  viewMode: 'user' | 'restaurant'
  setViewMode: (mode: 'user' | 'restaurant') => void
  isAdminSwitcher: boolean
}

const ViewModeContext = createContext<ViewModeContextType>({
  effectiveRole: 'user',
  viewMode: 'user',
  setViewMode: () => {},
  isAdminSwitcher: false,
})

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  const [viewMode, setViewModeState] = useState<'user' | 'restaurant'>('user')

  useEffect(() => {
    if (!loading && profile) {
      if (profile.is_admin) {
        const saved = localStorage.getItem('t4s_admin_view') as 'user' | 'restaurant' | null
        setViewModeState(saved ?? 'user')
      } else {
        setViewModeState(profile.role === 'restaurant' ? 'restaurant' : 'user')
      }
    }
  }, [loading, profile])

  const setViewMode = (mode: 'user' | 'restaurant') => {
    setViewModeState(mode)
    localStorage.setItem('t4s_admin_view', mode)
  }

  const effectiveRole: 'user' | 'restaurant' = profile?.is_admin
    ? viewMode
    : (profile?.role === 'restaurant' ? 'restaurant' : 'user')

  const isAdminSwitcher = !!profile?.is_admin

  return (
    <ViewModeContext.Provider value={{ effectiveRole, viewMode, setViewMode, isAdminSwitcher }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  return useContext(ViewModeContext)
}
