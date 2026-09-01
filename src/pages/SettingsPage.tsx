import { Bell, Mail, Moon, Sun, Globe, Shield, FileText, CreditCard, HelpCircle, LogOut, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { languageOptions } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

interface SettingsPageProps {
  onNavigate: (page: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function SettingsPage({ onNavigate, onAuthClick }: SettingsPageProps) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { effectiveRole } = useViewMode()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
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
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} variant={effectiveRole === 'restaurant' ? 'restaurant' : 'user'} />

        {error && <ErrorBanner message={error} className="mb-4" />}

        <div className="space-y-4">
          {/* Notificaciones */}
          <SettingsSection title={t('settings.notifications.title')} icon={<Bell className="w-5 h-5" />}>
            <ToggleRow
              icon={<Mail className="w-4 h-4" />}
              label={t('settings.notifications.email')}
              checked={profile?.email_notifications ?? true}
              loading={saving === 'email_notifications'}
              onChange={v => updatePref('email_notifications', v)}
            />
            <ToggleRow
              icon={<Bell className="w-4 h-4" />}
              label={t('settings.notifications.push')}
              checked={profile?.push_notifications ?? true}
              loading={saving === 'push_notifications'}
              onChange={v => updatePref('push_notifications', v)}
            />
          </SettingsSection>

          {/* Apariencia */}
          <SettingsSection title={t('settings.appearance.title')} icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}>
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('settings.appearance.darkMode')}</span>
              <Switch checked={theme === 'dark'} onChange={toggleTheme} />
            </div>
          </SettingsSection>

          {/* Idioma — grid scrollable con todos los idiomas */}
          <SettingsSection title={t('settings.language.title')} icon={<Globe className="w-5 h-5" />}>
            <p className="text-xs text-gray-400 dark:text-gray-500 px-1 pt-1 pb-2">{t('settings.language.subtitle')}</p>
            <div className="grid grid-cols-2 gap-2 px-1 pb-2">
              {languageOptions.map(lng => (
                <button
                  key={lng.code}
                  onClick={() => setLanguage(lng.code)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    language === lng.code
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg leading-none">{lng.emoji}</span>
                  <span className="truncate">{lng.label}</span>
                  {language === lng.code && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Privacidad y legal */}
          <SettingsSection title={t('settings.privacy.title')} icon={<Shield className="w-5 h-5" />}>
            <LinkRow label={t('settings.privacy.privacyPolicy')} onClick={() => onNavigate('politica-privacidad')} />
            <LinkRow label={t('settings.privacy.terms')} onClick={() => onNavigate('aviso-legal')} />
          </SettingsSection>

          {/* Ayuda y soporte */}
          <SettingsSection title={t('settings.support.title')} icon={<HelpCircle className="w-5 h-5" />}>
            <a href="mailto:soporte@table4singles.online" className="flex items-center justify-between px-1 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 transition-colors">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {t('settings.support.contact')}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
          </SettingsSection>

          <button
            onClick={signOut}
            className="w-full py-3 border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> {t('settings.signOut')}
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
