import { useState, useEffect } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PendingInviteProvider } from '@/contexts/PendingInviteContext'
import { Navbar } from '@/components/Navbar'
import { AuthModal } from '@/components/AuthModal'
import { PendingInviteBanner } from '@/components/PendingInviteBanner'
import { LandingPage } from '@/pages/LandingPage'
import { BrowsePage } from '@/pages/BrowsePage'
import { RestaurantsBrowsePage } from '@/pages/RestaurantsBrowsePage'
import { RestaurantProfilePage } from '@/pages/RestaurantProfilePage'
import { CompanionsPage } from '@/pages/CompanionsPage'
import { CreateTablePage } from '@/pages/CreateTablePage'
import { TableDetailPage } from '@/pages/TableDetailPage'
import { MyTablesPage } from '@/pages/MyTablesPage'
import { RestaurantDashboardPage } from '@/pages/RestaurantDashboardPage'
import { RestaurantAgendaPage } from '@/pages/RestaurantAgendaPage'
import { RestaurantReviewsPage } from '@/pages/RestaurantReviewsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { AvisoLegalPage } from '@/pages/AvisoLegalPage'

function AppRouter() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState('landing')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user && page === 'landing') setPage('browse')
    if (!loading && !user && !['landing', 'politica-privacidad', 'aviso-legal'].includes(page)) setPage('landing')
  }, [user, loading])

  // Capture referral code (?ref=<user_id>) for use during sign up
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('t4s_referred_by', ref)
      params.delete('ref')
      const newSearch = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
    }
  }, [])

  // Handle payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      const tableId = params.get('table')
      if (tableId) {
        setSelectedId(tableId)
        setPage('table-detail')
        setPaymentSuccess(true)
      }
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Handle auth callback
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setPage('browse')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const navigate = (p: string, id?: string) => {
    setPage(p)
    setSelectedId(id ?? null)
    if (p !== 'table-detail') setPaymentSuccess(false)
    window.scrollTo(0, 0)
  }

  const openAuth = (mode?: 'signin' | 'signup') => {
    setAuthMode(mode || 'signin')
    setAuthModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const renderPage = () => {
    if (user && profile && !profile.onboarding_completed) {
      return <OnboardingPage onNavigate={navigate} />
    }
    switch (page) {
      case 'landing':
        return <LandingPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'browse':
        return profile?.role === 'restaurant'
          ? <BrowsePage onNavigate={navigate} onAuthClick={openAuth} />
          : <RestaurantsBrowsePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'restaurant-profile':
        return selectedId ? <RestaurantProfilePage restaurantId={selectedId} onNavigate={navigate} onAuthClick={openAuth} /> : null
      case 'companions':
        return <CompanionsPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'create':
        return <CreateTablePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'table-detail':
        return selectedId ? <TableDetailPage tableId={selectedId} paymentSuccess={paymentSuccess} onNavigate={navigate} onAuthClick={openAuth} /> : null
      case 'my-tables': {
        const validTabs = ['hosting', 'reservations', 'invitations'] as const
        const initialTab = validTabs.includes(selectedId as typeof validTabs[number])
          ? (selectedId as typeof validTabs[number])
          : undefined
        return <MyTablesPage onNavigate={navigate} onAuthClick={openAuth} initialTab={initialTab} />
      }
      case 'restaurant-dashboard':
        return <RestaurantDashboardPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'agenda':
        return <RestaurantAgendaPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'reviews':
        return <RestaurantReviewsPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'profile':
        return <ProfilePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'settings':
        return <SettingsPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'politica-privacidad':
        return <PrivacyPolicyPage onNavigate={navigate} />
      case 'aviso-legal':
        return <AvisoLegalPage onNavigate={navigate} />
      default:
        return <RestaurantsBrowsePage onNavigate={navigate} onAuthClick={openAuth} />
    }
  }

  return (
    <>
      {user && <PendingInviteBanner />}
      {renderPage()}
      <AuthModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
      />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PendingInviteProvider>
            <AppRouter />
          </PendingInviteProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
