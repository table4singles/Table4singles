import { useState } from 'react'
import { X, Apple, Mail, Lock, Eye, EyeOff, ChevronLeft, Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { languageOptions } from '@/i18n'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onSwitchMode: (mode: 'signin' | 'signup') => void
}

type Screen = 'main' | 'forgot' | 'forgot-sent'

export function AuthModal({ isOpen, onClose, mode, onSwitchMode }: AuthModalProps) {
  const { signUp, signIn, signInWithGoogle, signInWithApple, resetPassword } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const [screen, setScreen] = useState<Screen>('main')
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [referralCode, setReferralCode] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('ref') ?? '' } catch { return '' }
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const resetState = () => { setError(null); setSuccess(null); setLoading(false) }

  const handleClose = () => { setScreen('main'); setShowLangPicker(false); resetState(); onClose() }

  const handleBack = () => { setScreen('main'); resetState() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      if (password.length < 8) {
        setError(t('auth.passwordStrength.hint'))
        return
      }
      if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
        setError(t('auth.passwordStrength.hint'))
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(email, password, name, role, referralCode.trim().toUpperCase() || undefined)
        if (err) throw err
        setSuccess(t('auth.checkEmail'))
      } else {
        const { error: err } = await signIn(email, password)
        if (err) throw err
        handleClose()
      }
    } catch (err: any) {
      setError(err.message || t('common.error'))
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await resetPassword(email)
      if (err) throw err
      setScreen('forgot-sent')
    } catch (err: any) {
      setError(err.message || t('common.error'))
    }
    setLoading(false)
  }

  const currentLang = languageOptions.find(l => l.code === language)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* ── Pantalla principal ── */}
        {screen === 'main' && (
          <>
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-2">
                <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                    {mode === 'signup' ? t('auth.createAccount') : t('auth.welcomeBack')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {mode === 'signup' ? t('auth.joinCommunity') : t('auth.signInContinue')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Selector de idioma compacto */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangPicker(v => !v)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300"
                    title={t('auth.selectLanguage')}
                  >
                    <span className="text-base leading-none">{currentLang?.emoji ?? '🌐'}</span>
                    <Globe className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {showLangPicker && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 p-2 grid grid-cols-3 gap-1 w-44">
                      {languageOptions.map(lng => (
                        <button
                          key={lng.code}
                          onClick={() => { setLanguage(lng.code); setShowLangPicker(false) }}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            language === lng.code
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-sm leading-none">{lng.emoji}</span>
                          <span className="truncate">{lng.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6">
              {mode === 'signup' && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('auth.iAm')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <RoleButton selected={role === 'user'} onClick={() => setRole('user')} title={t('auth.privateUser')} desc={t('auth.privateUserDesc')} />
                    <RoleButton selected={role === 'restaurant'} onClick={() => setRole('restaurant')} title={t('auth.restaurant')} desc={t('auth.restaurantDesc')} />
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-5">
                <button onClick={() => signInWithApple()} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                  <Apple className="w-5 h-5" /> {t('auth.continueWithApple')}
                </button>
                <button onClick={() => signInWithGoogle()} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <GoogleIcon /> {t('auth.continueWithGoogle')}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <Input label={t('auth.name')} placeholder={t('auth.namePlaceholder')} value={name} onChange={setName} />
                )}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Indicador de fortaleza de contraseña */}
                {mode === 'signup' && password.length > 0 && (() => {
                  const has8 = password.length >= 8
                  const hasUpper = /[A-Z]/.test(password)
                  const hasNumber = /[0-9]/.test(password)
                  const strength = [has8, hasUpper || hasNumber].filter(Boolean).length
                  const bars = [
                    strength === 0 ? 'bg-red-400' : strength === 1 ? 'bg-yellow-400' : 'bg-green-500',
                    strength >= 2 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700',
                  ]
                  const label = strength === 0 ? t('auth.passwordStrength.veryWeak') : strength === 1 ? t('auth.passwordStrength.weak') : t('auth.passwordStrength.strong')
                  const labelColor = strength === 0 ? 'text-red-500' : strength === 1 ? 'text-yellow-500' : 'text-green-600'
                  return (
                    <div className="mt-1.5">
                      <div className="flex gap-1 mb-1">
                        {bars.map((c, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${c}`} />)}
                      </div>
                      <p className={`text-xs ${labelColor}`}>{label} · {t('auth.passwordStrength.hint')}</p>
                    </div>
                  )
                })()}

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setScreen('forgot'); setError(null) }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <input
                      type="text"
                      placeholder={t('auth.referralCode')}
                      value={referralCode}
                      onChange={e => setReferralCode(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
                {success && <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">{success}</p>}

                <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                  {loading ? '...' : mode === 'signup' ? t('auth.submit.signUp') : t('auth.submit.signIn')}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
                <button onClick={() => { onSwitchMode(mode === 'signup' ? 'signin' : 'signup'); resetState() }} className="text-primary-600 font-medium hover:text-primary-700">
                  {mode === 'signup' ? t('auth.switchSignIn') : t('auth.switchSignUp')}
                </button>
              </p>
            </div>
          </>
        )}

        {/* ── Pantalla "olvidé mi contraseña" ── */}
        {screen === 'forgot' && (
          <>
            <div className="flex items-center gap-2 p-6 pb-4">
              <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">{t('auth.forgotPasswordTitle')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.forgotPasswordDesc')}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                  {loading ? '...' : t('auth.sendRecoveryLink')}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── Pantalla de confirmación enviada ── */}
        {screen === 'forgot-sent' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.emailSentTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {email && <><strong>{email}</strong> — </>}{t('auth.emailSentDesc')}
            </p>
            <button onClick={handleClose} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
              {t('auth.emailSentOk')}
            </button>
            <button onClick={handleBack} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {t('auth.backToSignIn')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleButton({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
      <p className={`font-medium text-sm ${selected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
    </button>
  )
}

function Input({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
      />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
