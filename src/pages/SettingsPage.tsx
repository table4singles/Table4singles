import { useState } from 'react'
import { Bell, Mail, Moon, Sun, Globe, Shield, FileText, CreditCard, HelpCircle, LogOut, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

interface SettingsPageProps {
  onNavigate: (page: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function SettingsPage({ onNavigate, onAuthClick }: SettingsPageProps) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const updatePref = async (field: string, value: boolean) => {
    if (!user) return
    setSaving(field)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id)
    if (err) setError(err.message)
    else await refreshProfile()
    setSaving(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar currentPage="settings" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Ajustes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestiona tu cuenta y preferencias</p>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        <div className="space-y-4">
          {/* Suscripción */}
          <SettingsSection title="Suscripción" icon={<CreditCard className="w-5 h-5" />}>
            <div className="flex items-center justify-between px-1 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Plan actual: Gratuito</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Los planes premium estarán disponibles próximamente</p>
              </div>
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-3 py-1 rounded-full">Próximamente</span>
            </div>
          </SettingsSection>

          {/* Notificaciones */}
          <SettingsSection title="Notificaciones" icon={<Bell className="w-5 h-5" />}>
            <ToggleRow
              icon={<Mail className="w-4 h-4" />}
              label="Notificaciones por email"
              checked={profile?.email_notifications ?? true}
              loading={saving === 'email_notifications'}
              onChange={v => updatePref('email_notifications', v)}
            />
            <ToggleRow
              icon={<Bell className="w-4 h-4" />}
              label="Notificaciones en la app"
              checked={profile?.push_notifications ?? true}
              loading={saving === 'push_notifications'}
              onChange={v => updatePref('push_notifications', v)}
            />
          </SettingsSection>

          {/* Apariencia */}
          <SettingsSection title="Apariencia" icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}>
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-200">Modo oscuro</span>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} />
            </div>
          </SettingsSection>

          {/* Idioma */}
          <SettingsSection title="Idioma" icon={<Globe className="w-5 h-5" />}>
            <div className="flex gap-2 px-1 py-2">
              {(['es', 'en', 'de'] as const).map(lng => (
                <button
                  key={lng}
                  onClick={() => setLanguage(lng)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${language === lng ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {lng === 'es' ? 'Español' : lng === 'en' ? 'English' : 'Deutsch'}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Privacidad y legal */}
          <SettingsSection title="Privacidad y legal" icon={<Shield className="w-5 h-5" />}>
            <LinkRow label="Política de privacidad" onClick={() => onNavigate('politica-privacidad')} />
            <LinkRow label="Términos y condiciones" onClick={() => onNavigate('aviso-legal')} />
          </SettingsSection>

          {/* Ayuda y soporte */}
          <SettingsSection title="Ayuda y soporte" icon={<HelpCircle className="w-5 h-5" />}>
            <a href="mailto:soporte@table4singles.online" className="flex items-center justify-between px-1 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 transition-colors">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Contactar con soporte</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
          </SettingsSection>

          <button
            onClick={signOut}
            className="w-full py-3 border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  )
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">{children}</div>
    </div>
  )
}

function ToggleRow({ icon, label, checked, loading, onChange }: { icon: React.ReactNode; label: string; checked: boolean; loading: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-1 py-2.5">
      <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">{icon} {label}</span>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Switch checked={checked} onChange={() => onChange(!checked)} />}
    </div>
  )
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-1 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 transition-colors">
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform flex items-center justify-center ${checked ? 'translate-x-5' : ''}`}>
        {checked && <Check className="w-3 h-3 text-primary-500" />}
      </span>
    </button>
  )
}
