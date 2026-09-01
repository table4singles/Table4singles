import { useState, useEffect } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PendingInviteProvider } from '@/contexts/PendingInviteContext'
import { ViewModeProvider, useViewMode } from '@/contexts/ViewModeContext'
import { AuthModal } from '@/components/AuthModal'
import { InstallPrompt } from '@/components/InstallPrompt'
import { LandingPage } from '@/pages/LandingPage'
import { RestaurantLandingPage } from '@/pages/RestaurantLandingPage'
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
import { AmbassadorPage } from '@/pages/AmbassadorPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { AdminPage } from '@/pages/AdminPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { FlyerPage } from '@/pages/FlyerPage'
import { useAnalytics } from '@/hooks/useAnalytics'

function AppRouter() {
  const { user, profile, loading, isPasswordRecovery } = useAuth()
  const { effectiveRole } = useViewMode()
  const { track } = useAnalytics()
  const [page, setPage] = useState('landing')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)

  useEffect(() => {
    if (!loading && user && profile && page === 'landing') {
      const pendingTable = localStorage.getItem('t4s_invite_table')
      if (pendingTable) {
        localStorage.removeItem('t4s_invite_table')
        setSelectedId(pendingTable)
        setPage('table-detail')
        return
      }
      const savedMode = profile.is_admin
        ? (localStorage.getItem('t4s_admin_view') as 'user' | 'restaurant' | null) ?? 'user'
        : profile.role
      setPage(savedMode === 'restaurant' ? 'restaurant-dashboard' : 'browse')
    }
    if (!loading && !user && !['landing', 'restaurant-landing', 'politica-privacidad', 'aviso-legal', 'flyer', 'table-detail'].includes(page)) setPage('landing')
  }, [user, loading, profile])

  // Landing de captación para restaurantes (/restaurantes) — ruta pública sin login
  useEffect(() => {
    if (window.location.pathname === '/restaurantes') setPage('restaurant-landing')
  }, [])

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
    const payment = params.get('payment')

    if (payment === 'success') {
      const tableId = params.get('table')
      if (tableId) {
        setSelectedId(tableId)
        setPage('table-detail')
        setPaymentSuccess(true)
      }
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (payment === 'cancelled') {
      const tableId = params.get('table')
      if (tableId) {
        setSelectedId(tableId)
        setPage('table-detail')
        setPaymentCancelled(true)
      }
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (payment === 'subscription-success') {
      window.history.replaceState({}, '', window.location.pathname)
      setPage('subscription')
    }
  }, [])

  // Handle auth callback (confirmación email / OAuth Google)
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setPage('browse')
      // Mantener hash/query un instante para que supabase.js intercambie la sesión
      const t = window.setTimeout(() => {
        window.history.replaceState({}, '', '/')
      }, 50)
      return () => window.clearTimeout(t)
    }
  }, [])

  // Handle flyer link (?flyer=restaurantId) — ruta pública sin login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const flyerId = params.get('flyer')
    if (flyerId) {
      setSelectedId(flyerId)
      setPage('flyer')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Invitación a una cena (?invite=tableId) — quien no tenga cuenta ve la mesa y puede registrarse
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteId = params.get('invite')
    if (inviteId) {
      localStorage.setItem('t4s_invite_table', inviteId)
      setSelectedId(inviteId)
      setPage('table-detail')
      track('INVITATION_CLICKED', { table_id: inviteId })
      params.delete('invite')
      const newSearch = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
    }
  }, [])

  const navigate = (p: string, id?: string) => {
    setPage(p)
    setSelectedId(id ?? null)
    if (p !== 'table-detail') { setPaymentSuccess(false); setPaymentCancelled(false) }
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
    if (isPasswordRecovery) {
      return <ResetPasswordPage />
    }
    if (user && profile && !profile.onboarding_completed) {
      return <OnboardingPage onNavigate={navigate} />
    }
    switch (page) {
      case 'landing':
        return <LandingPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'restaurant-landing':
        return <RestaurantLandingPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'browse':
        return effectiveRole === 'restaurant'
          ? <RestaurantDashboardPage onNavigate={navigate} onAuthClick={openAuth} />
          : <BrowsePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'restaurants-list':
        return <RestaurantsBrowsePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'restaurant-profile':
        return selectedId ? <RestaurantProfilePage restaurantId={selectedId} onNavigate={navigate} onAuthClick={openAuth} /> : null
      case 'companions':
        return <CompanionsPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'create':
        return <CreateTablePage onNavigate={navigate} onAuthClick={openAuth} />
      case 'table-detail':
        return selectedId ? <TableDetailPage tableId={selectedId} paymentSuccess={paymentSuccess} paymentCancelled={paymentCancelled} onNavigate={navigate} onAuthClick={openAuth} /> : null
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
      case 'flyer':
        return selectedId ? <FlyerPage restaurantId={selectedId} /> : null
      case 'politica-privacidad':
        return <PrivacyPolicyPage onNavigate={navigate} />
      case 'aviso-legal':
        return <AvisoLegalPage onNavigate={navigate} />
      case 'ambassador':
        return <AmbassadorPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'subscription':
        return <SubscriptionPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'analytics':
        return <AnalyticsPage onNavigate={navigate} onAuthClick={openAuth} />
      case 'admin':
        return <AdminPage onNavigate={navigate} onAuthClick={openAuth} />
      default:
        return <RestaurantsBrowsePage onNavigate={navigate} onAuthClick={openAuth} />
    }
  }

  return (
    <>
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
            <ViewModeProvider>
              <AppRouter />
              <InstallPrompt />
            </ViewModeProvider>
          </PendingInviteProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
