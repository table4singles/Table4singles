import { useState, useRef, useEffect } from 'react'
import { LayoutGrid, Search, Plus, CalendarDays, CalendarClock, Mail, User, LogOut, Bell, LayoutDashboard, Settings, Users, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNotifications } from '@/hooks/useNotifications'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationsPanel } from './NotificationsPanel'

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function Navbar({ currentPage, onNavigate, onAuthClick }: NavbarProps) {
  const { user, profile, signOut } = useAuth()
  const { t } = useLanguage()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate(user ? 'browse' : 'landing')} className="flex items-center">
          <img src="/icons/logo-full.png" alt="Table4Singles" className="h-12 w-auto" />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {(!user || profile?.role === 'user') && (
            <NavLink active={currentPage === 'browse' || currentPage === 'restaurant-profile'} onClick={() => onNavigate('browse')} icon={<LayoutGrid className="w-4 h-4" />} label="Restaurantes" />
          )}
          {user && profile?.role === 'restaurant' && (
            <>
              <NavLink active={currentPage === 'restaurant-dashboard'} onClick={() => onNavigate('restaurant-dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label={t('nav.dashboard')} />
              <NavLink active={currentPage === 'agenda'} onClick={() => onNavigate('agenda')} icon={<CalendarClock className="w-4 h-4" />} label={t('nav.agenda')} />
              <NavLink active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-4 h-4" />} label={t('nav.myTables')} />
            </>
          )}
          {user && profile?.role === 'user' && (
            <>
              <NavLink active={currentPage === 'companions'} onClick={() => onNavigate('companions')} icon={<Users className="w-4 h-4" />} label="Comensales" />
              <NavLink active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-4 h-4" />} label="Mis reservas" />
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
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
                  />
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {profile?.display_name || profile?.restaurant_name || 'User'}
                  </span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 w-48 animate-fade-in">
                    <button onClick={() => { onNavigate('profile'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> {t('nav.profile')}
                    </button>
                    <button onClick={() => { onNavigate('settings'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Ajustes
                    </button>
                    {profile?.role === 'restaurant' && (
                      <button onClick={() => { onNavigate('aviso-legal'); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Contrato
                      </button>
                    )}
                    <button onClick={() => { signOut(); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t border-gray-100 dark:border-gray-700">
                      <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => onAuthClick('signin')} className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                {t('nav.signIn')}
              </button>
              <button onClick={() => onAuthClick('signup')} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm">
                {t('nav.signUp')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 px-2 pb-safe">
          <div className="flex justify-around py-2">
            {profile?.role !== 'restaurant' && (
              <MobileNavButton active={currentPage === 'browse' || currentPage === 'restaurant-profile'} onClick={() => onNavigate('browse')} icon={<Search className="w-5 h-5" />} label="Restaurantes" />
            )}
            {profile?.role === 'restaurant' ? (
              <>
                <MobileNavButton active={currentPage === 'restaurant-dashboard'} onClick={() => onNavigate('restaurant-dashboard')} icon={<LayoutDashboard className="w-5 h-5" />} label={t('nav.dashboard')} />
                <MobileNavButton active={currentPage === 'agenda'} onClick={() => onNavigate('agenda')} icon={<CalendarClock className="w-5 h-5" />} label={t('nav.agenda')} />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-5 h-5" />} label={t('nav.myTables')} />
              </>
            ) : (
              <>
                <MobileNavButton active={currentPage === 'companions'} onClick={() => onNavigate('companions')} icon={<Users className="w-5 h-5" />} label="Comensales" />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables')} icon={<CalendarDays className="w-5 h-5" />} label="Reservas" />
                <MobileNavButton active={currentPage === 'my-tables'} onClick={() => onNavigate('my-tables', 'invitations')} icon={<Mail className="w-5 h-5" />} label="Invitaciones" />
              </>
            )}
            <MobileNavButton active={currentPage === 'profile'} onClick={() => onNavigate('profile')} icon={<User className="w-5 h-5" />} label={t('nav.profile')} />
          </div>
        </nav>
      )}
    </header>
  )
}

function NavLink({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
      {icon} {label}
    </button>
  )
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${active ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
