import { useState, useRef, useEffect } from 'react'
import { LayoutGrid, Search, Plus, CalendarDays, CalendarClock, Mail, User, LogOut, Bell, LayoutDashboard, Settings, Users, FileText, Star, Award, CreditCard, ShieldCheck, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useViewMode } from '@/contexts/ViewModeContext'
import { Avatar } from './Avatar'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationsPanel } from './NotificationsPanel'
import { PendingInviteBanner } from './PendingInviteBanner'
import { AmbassadorBanner } from './AmbassadorBanner'

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function Navbar({ currentPage, onNavigate, onAuthClick }: NavbarProps) {
  const { user, profile, signOut } = useAuth()
  const { t, language } = useLanguage()
  const { effectiveRole, setViewMode, isAdminSwitcher } = useViewMode()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? null)

  const switchToMode = (mode: 'user' | 'restaurant') => {
    setViewMode(mode)
    onNavigate(mode === 'restaurant' ? 'restaurant-dashboard' : 'browse')
    setShowMenu(false)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
    <header className="sticky top-0 z-50 bg-navy-950 border-b border-gold-500/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate(user ? 'browse' : 'landing')} className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0">
            <img src="/icons/logo-full.png" alt="" className="h-full w-full object-cover object-left" />
          </span>
          <span className="font-display font-bold text-lg text-white whitespace-nowrap">Table4Singles</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {/* Toggle de vista para admins */}
          {isAdminSwitcher && (
            <div className="flex items-center bg-white/5 rounded-full p-0.5 mr-2">
              <button
                onClick={() => switchToMode('user')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${effectiveRole === 'user' ? 'bg-navy-800 text-sky-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <User className="w-3 h-3" /> {t('nav.user')}
              </button>
              <button
                onClick={() => switchToMode('restaurant')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${effectiveRole === 'restaurant' ? 'bg-navy-800 text-orange-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <LayoutDashboard className="w-3 h-3" /> {t('nav.restaurant')}
              </button>
            </div>
          )}
          {(!user || effectiveRole === 'user') && currentPage !== 'restaurant-landing' && (
            <NavLink active={currentPage === 'browse' || currentPage === 'restaurant-profile'} onClick={() => onNavigate('browse')} icon={<LayoutGrid className="w-4 h-4" />} label={t('nav.dinners')} />
          )}
          {user && effectiveRole === 'restaurant' && (
            <>
              <NavLink active={currentPage === 'restaurant-dashboard'} onClick={() => onNavigate('restaurant-dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label={t('nav.dashboard')} />
              <NavLink active={currentPage === 'agenda'} onClick={() => onNavigate('agenda')} icon={<CalendarClock className="w-4 h-4" />} label={t('nav.agenda')} />
              <NavLink active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-4 h-4" />} label={t('nav.myTables')} />
              <NavLink active={currentPage === 'reviews'} onClick={() => onNavigate('reviews')} icon={<Star className="w-4 h-4" />} label={t('nav.reviews')} />
              <NavLink
                active={currentPage === 'subscription'}
                onClick={() => onNavigate('subscription')}
                icon={<CreditCard className="w-4 h-4" />}
                label={t('nav.subscription')}
                alert={!profile?.subscription_status || profile.subscription_status === 'canceled' || profile.subscription_status === 'past_due'}
              />
            </>
          )}
          {user && effectiveRole === 'user' && (
            <>
              <NavLink active={currentPage === 'companions'} onClick={() => onNavigate('companions')} icon={<Users className="w-4 h-4" />} label={t('nav.companions')} />
              <NavLink active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-4 h-4" />} label={t('nav.myReservations')} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold-500 text-navy-900 text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsPanel
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onClose={() => setShowNotifications(false)}
                    t={t}
                    language={language}
                  />
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center overflow-hidden">
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.display_name || profile?.restaurant_name}
                      fit={effectiveRole === 'restaurant' ? 'contain' : 'cover'}
                      className={`w-full h-full ${effectiveRole === 'restaurant' ? 'p-0.5' : ''}`}
                      textClassName="text-xs"
                    />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[120px] truncate">
                    {profile?.display_name || profile?.restaurant_name || 'User'}
                  </span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-navy-900 rounded-xl shadow-e4 border border-gold-500/15 overflow-hidden z-50 w-52 animate-fade-in">
                    {/* Switcher de vista para admins */}
                    {isAdminSwitcher && (
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-gray-500 mb-2 font-medium">{t('nav.activeView')}</p>
                        <div className="flex gap-1 bg-white/5 rounded-full p-0.5">
                          <button
                            onClick={() => switchToMode('user')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-xs font-semibold transition-all ${effectiveRole === 'user' ? 'bg-navy-800 text-sky-400 shadow-sm' : 'text-gray-500'}`}
                          >
                            <User className="w-3 h-3" /> {t('nav.user')}
                          </button>
                          <button
                            onClick={() => switchToMode('restaurant')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-xs font-semibold transition-all ${effectiveRole === 'restaurant' ? 'bg-navy-800 text-orange-400 shadow-sm' : 'text-gray-500'}`}
                          >
                            <LayoutDashboard className="w-3 h-3" /> {t('nav.restaurant')}
                          </button>
                        </div>
                      </div>
                    )}
                    <button onClick={() => { onNavigate('profile'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2">
                      <User className="w-4 h-4" /> {t('nav.profile')}
                    </button>
                    <button onClick={() => { onNavigate('settings'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> {t('nav.settings')}
                    </button>
                    {effectiveRole === 'restaurant' && (
                      <>
                        <button onClick={() => { onNavigate('subscription'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="flex-1">{t('nav.subscription')}</span>
                          {(!profile?.subscription_status || profile.subscription_status === 'canceled' || profile.subscription_status === 'past_due') && (
                            <span className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />
                          )}
                        </button>
                        <button onClick={() => { onNavigate('aviso-legal'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/5 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> {t('settings.privacy.terms')}
                        </button>
                      </>
                    )}
                    {effectiveRole === 'user' && (
                      <button onClick={() => { onNavigate('ambassador'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-gold-400">
                        <Award className="w-4 h-4" /> {t('nav.becomeAmbassador')}
                      </button>
                    )}
                    {profile?.is_admin && (
                      <button onClick={() => { onNavigate('admin'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-violet-400 border-t border-white/10">
                        <ShieldCheck className="w-4 h-4" /> {t('nav.adminPanel')}
                      </button>
                    )}
                    <button onClick={() => { signOut(); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-red-400 border-t border-white/10">
                      <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => onAuthClick('signin')} className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                {t('nav.signIn')}
              </button>
              <button onClick={() => onAuthClick('signup')} className="px-5 py-2 text-sm font-bold text-navy-900 bg-gradient-to-r from-gold-300 to-gold-500 hover:from-gold-200 hover:to-gold-400 rounded-full transition-all shadow-glow-gold">
                {t('nav.signUp')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-gold-500/10 z-50 px-2 pb-safe">
          <div className="flex justify-around py-2">
            {effectiveRole !== 'restaurant' && (
              <MobileNavButton active={currentPage === 'browse' || currentPage === 'restaurant-profile'} onClick={() => onNavigate('browse')} icon={<Search className="w-5 h-5" />} label={t('nav.dinners')} />
            )}
            {effectiveRole === 'restaurant' ? (
              <>
                <MobileNavButton active={currentPage === 'restaurant-dashboard'} onClick={() => onNavigate('restaurant-dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label={t('nav.dashboard')} />
                <MobileNavButton active={currentPage === 'agenda'} onClick={() => onNavigate('agenda')} icon={<CalendarClock className="w-5 h-5" />} label={t('nav.agenda')} />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-5 h-5" />} label={t('nav.myTables')} />
                <MobileNavButton active={currentPage === 'reviews'} onClick={() => onNavigate('reviews')} icon={<Star className="w-5 h-5" />} label={t('nav.reviews')} />
              </>
            ) : (
              <>
                <MobileNavButton active={currentPage === 'companions'} onClick={() => onNavigate('companions')} icon={<Users className="w-5 h-5" />} label={t('nav.companions')} />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-5 h-5" />} label={t('nav.reservations')} />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables', 'invitations')} icon={<Mail className="w-5 h-5" />} label={t('nav.invitations')} />
              </>
            )}
            {isAdminSwitcher ? (
              <MobileNavButton
                active={false}
                onClick={() => switchToMode(effectiveRole === 'user' ? 'restaurant' : 'user')}
                icon={<ArrowLeftRight className="w-5 h-5" />}
                label={effectiveRole === 'user' ? t('nav.restaurant') : t('nav.user')}
              />
            ) : (
              <MobileNavButton active={currentPage === 'profile'} onClick={() => onNavigate('profile')} icon={<User className="w-5 h-5" />} label={t('nav.profile')} />
            )}
          </div>
        </nav>
      )}
    </header>
    {user && <PendingInviteBanner />}
    {user && effectiveRole === 'user' && <AmbassadorBanner onNavigate={onNavigate} />}
    </>
  )
}

function NavLink({ active, onClick, icon, label, alert }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; alert?: boolean }) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? 'text-gold-300 bg-gold-400/10' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
      {alert && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-400" />}
    </button>
  )
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${active ? 'text-gold-400' : 'text-gray-500'}`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
