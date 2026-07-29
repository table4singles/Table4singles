import { useState } from 'react'
import { X, Apple, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { checkPasswordBreach } from '@/lib/security'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onSwitchMode: (mode: 'signin' | 'signup') => void
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode }: AuthModalProps) {
  const { signUp, signIn, signInWithGoogle, signInWithApple } = useAuth()
  const { t } = useLanguage()
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const breached = await checkPasswordBreach(password)
        if (breached) {
          setError('This password has appeared in a data breach. Please choose a different one.')
          setLoading(false)
          return
        }
        const { error: err } = await signUp(email, password, name, role)
        if (err) throw err
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error: err } = await signIn(email, password)
        if (err) throw err
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {mode === 'signup' ? t('auth.createAccount') : t('auth.welcomeBack')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'signup' ? t('auth.joinCommunity') : t('auth.signInContinue')}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-6">
            {mode === 'signup' && (
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('auth.iAm')}</p>
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
              <button onClick={() => signInWithGoogle()} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <GoogleIcon /> {t('auth.continueWithGoogle')}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input label={t('auth.name')} placeholder={t('auth.namePlaceholder')} value={name} onChange={setName} />
              )}
              <IconInput icon={<Mail className="w-4 h-4 text-gray-400" />} placeholder={t('auth.emailPlaceholder')} type="email" value={email} onChange={setEmail} />
              <IconInput icon={<Lock className="w-4 h-4 text-gray-400" />} placeholder={t('auth.passwordPlaceholder')} type="password" value={password} onChange={setPassword} />

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {loading ? '...' : mode === 'signup' ? t('auth.submit.signUp') : t('auth.submit.signIn')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
              <button onClick={() => onSwitchMode(mode === 'signup' ? 'signin' : 'signup')} className="text-primary-600 font-medium hover:text-primary-700">
                {mode === 'signup' ? t('auth.switchSignIn') : t('auth.switchSignUp')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function RoleButton({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <p className={`font-medium text-sm ${selected ? 'text-primary-700' : 'text-gray-700'}`}>{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </button>
  )
}

function Input({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
      />
    </div>
  )
}

function IconInput({ icon, placeholder, type = 'text', value, onChange }: { icon: React.ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
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
