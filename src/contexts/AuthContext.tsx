import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isPasswordRecovery: boolean
  signUp: (email: string, password: string, name: string, role: 'user' | 'restaurant', referralCode?: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string, role?: string) => Promise<{ error: Error | null }>
  signInWithGoogle: (role?: 'user' | 'restaurant') => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Tras OAuth Google: aplicar rol de restaurante solo si el perfil es recién creado
    const pendingRole = localStorage.getItem('t4s_pending_role') as 'user' | 'restaurant' | null
    if (pendingRole === 'restaurant' && data?.role === 'user' && !data.onboarding_completed) {
      const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0
      const isBrandNew = createdAt > 0 && Date.now() - createdAt < 5 * 60 * 1000
      if (isBrandNew) {
        localStorage.removeItem('t4s_pending_role')
        const { data: updated } = await supabase
          .from('profiles')
          .update({ role: 'restaurant' })
          .eq('id', userId)
          .select('*')
          .single()
        setProfile(updated ?? data)
        return
      }
    }
    if (pendingRole) localStorage.removeItem('t4s_pending_role')
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) await fetchProfile(s.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      else setProfile(null)
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = useCallback(async (email: string, password: string, name: string, role: 'user' | 'restaurant', referralCode?: string) => {
    const referredBy = referralCode || localStorage.getItem('t4s_referred_by') || undefined
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: name,
          role,
          referred_by: referredBy,
        },
      },
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
        return {
          error: new Error('EMAIL_ALREADY_REGISTERED'),
          needsEmailConfirmation: false,
        }
      }
      return { error: new Error(error.message), needsEmailConfirmation: false }
    }
    localStorage.removeItem('t4s_referred_by')

    // Identities vacío = email ya existía (Supabase no revela el detalle por seguridad)
    const isDuplicateSoft = Boolean(data.user) && (data.user?.identities?.length ?? 0) === 0
    if (isDuplicateSoft) {
      return { error: new Error('EMAIL_ALREADY_REGISTERED'), needsEmailConfirmation: false }
    }

    // Sin sesión → hay que confirmar el email antes de entrar
    return {
      error: null,
      needsEmailConfirmation: !data.session,
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        return { error: new Error('EMAIL_NOT_CONFIRMED') }
      }
      return { error: new Error(error.message) }
    }
    return { error: null }
  }, [])

  const signInWithMagicLink = useCallback(async (email: string, role?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: role ? { role } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signInWithGoogle = useCallback(async (role?: 'user' | 'restaurant') => {
    if (role) localStorage.setItem('t4s_pending_role', role)
    else localStorage.removeItem('t4s_pending_role')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setIsPasswordRecovery(false)
    return { error: error ? new Error(error.message) : null }
  }, [])

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, isPasswordRecovery,
      signUp, signIn, signInWithMagicLink, signInWithGoogle,
      signOut, refreshProfile, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
