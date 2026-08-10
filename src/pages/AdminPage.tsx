import { useState } from 'react'
import {
  Users, UtensilsCrossed, Award, CreditCard, Loader2, RefreshCw,
  TrendingUp, Euro, CheckCircle, ShieldAlert,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/hooks/useAdminData'

interface AdminPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

type Tab = 'resumen' | 'usuarios' | 'restaurantes' | 'embajadores' | 'movimientos'

const SUB_BADGE: Record<string, { label: string; color: string }> = {
  active:     { label: 'Activa',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  trialing:   { label: 'Prueba',          color: 'bg-blue-100 text-blue-700' },
  past_due:   { label: 'Pago pendiente',  color: 'bg-orange-100 text-orange-700' },
  canceled:   { label: 'Cancelada',       color: 'bg-red-100 text-red-600' },
  incomplete: { label: 'Incompleta',      color: 'bg-orange-100 text-orange-700' },
  unpaid:     { label: 'Impagada',        color: 'bg-red-100 text-red-600' },
}

const PAYMENT_BADGE: Record<string, string> = {
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
  failed:   'bg-red-100 text-red-600',
}

export function AdminPage({ onNavigate, onAuthClick }: AdminPageProps) {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('resumen')
  const isAdmin = profile?.is_admin === true
  const { stats, users, restaurants, ambassadors, payments, loading, error, refresh } = useAdminData(isAdmin)

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="admin" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Acceso restringido</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Esta sección es solo para administradores de Table4Singles.</p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',      label: 'Resumen',                                          icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'usuarios',     label: `Usuarios (${users.filter(u => u.role === 'user').length})`,  icon: <Users className="w-4 h-4" /> },
    { id: 'restaurantes', label: `Restaurantes (${restaurants.length})`,             icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'embajadores',  label: `Embajadores (${ambassadors.length})`,              icon: <Award className="w-4 h-4" /> },
    { id: 'movimientos',  label: `Movimientos (${payments.length})`,                 icon: <CreditCard className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="admin" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Panel de administración</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Table4Singles · Vista global</p>
          </div>
          <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.id ? 'bg-[#e94560] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : (
          <>
            {tab === 'resumen'      && <TabResumen stats={stats} ambassadors={ambassadors} />}
            {tab === 'usuarios'     && <TabUsuarios users={users.filter(u => u.role === 'user')} />}
            {tab === 'restaurantes' && <TabRestaurantes restaurants={restaurants} />}
            {tab === 'embajadores'  && <TabEmbajadores ambassadors={ambassadors} />}
            {tab === 'movimientos'  && <TabMovimientos payments={payments} />}
          </>
        )}
      </main>
    </div>
  )
}

function TabResumen({ stats, ambassadors }: { stats: any; ambassadors: any[] }) {
  const s = stats ?? {}
  const totalCommission = ambassadors.reduce((sum: number, a: any) => sum + (a.monthly_commission_cts ?? 0), 0)
  const kpis = [
    { label: 'Usuarios',             value: s.total_users ?? 0,          icon: <Users className="w-5 h-5 text-blue-500" />,           bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Restaurantes',         value: s.total_restaurants ?? 0,    icon: <UtensilsCrossed className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Suscripciones activas',value: s.active_subscriptions ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-500" />,     bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Embajadores activos',  value: s.total_ambassadors ?? 0,    icon: <Award className="w-5 h-5 text-purple-500" />,          bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Total reservas',       value: s.total_reservations ?? 0,   icon: <CreditCard className="w-5 h-5 text-teal-500" />,       bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Reservas pagadas',     value: s.paid_reservations ?? 0,    icon: <CheckCircle className="w-5 h-5 text-teal-600" />,      bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>{k.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Euro className="w-4 h-4 text-green-500" /> Financiero
          <span className="text-xs text-gray-400 font-normal">(estimado hasta activar Stripe)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FinBox label="MRR estimado"              value={`${((s.mrr_cts ?? 0) / 100).toFixed(2)} €`}                        desc="Suscripciones activas × 10 €" />
          <FinBox label="Ingresos reservas"         value={`${((s.reservation_revenue_cts ?? 0) / 100).toFixed(2)} €`}         desc="Pagos reales vía Stripe" stripe />
          <FinBox label="Comisiones embajadores/mes" value={`${(totalCommission / 100).toFixed(2)} €`}                         desc="Suma de todos los embajadores" />
          <FinBox label="Net MRR est."              value={`${(((s.mrr_cts ?? 0) - totalCommission) / 100).toFixed(2)} €`}    desc="MRR − comisiones embajadores" />
        </div>
      </div>
    </div>
  )
}

function FinBox({ label, value, desc, stripe }: { label: string; value: string; desc: string; stripe?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mt-1">{label}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
      {stripe && <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">Activo con Stripe</span>}
    </div>
  )
}

function TabUsuarios({ users }: { users: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>Nombre</Th><Th>Email</Th><Th>Registrado</Th><Th>Admin</Th></tr></thead>
          <tbody>
            {users.length === 0
              ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Sin usuarios</td></tr>
              : users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <Td>{u.display_name || '—'}</Td><Td>{u.email || '—'}</Td><Td>{fmtDate(u.created_at)}</Td>
                  <Td>{u.is_admin ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span> : '—'}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabRestaurantes({ restaurants }: { restaurants: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>Restaurante</Th><Th>Email</Th><Th>Suscripción</Th><Th>Mesas activas</Th><Th>Reservas</Th><Th>Embajador</Th><Th>Registro</Th></tr></thead>
          <tbody>
            {restaurants.length === 0
              ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin restaurantes</td></tr>
              : restaurants.map(r => {
                const sub = r.subscription_status ? (SUB_BADGE[r.subscription_status] ?? { label: r.subscription_status, color: 'bg-gray-100 text-gray-600' }) : null
                return (
                  <tr key={r.restaurant_id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <Td><span className="font-medium">{r.restaurant_name || '—'}</span></Td>
                    <Td>{r.email || '—'}</Td>
                    <Td>{sub ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.color}`}>{sub.label}</span> : <span className="text-xs text-gray-400">Sin suscripción</span>}</Td>
                    <Td>{r.active_tables}</Td><Td>{r.total_reservations}</Td>
                    <Td>{r.ambassador_name || <span className="text-gray-400">—</span>}</Td>
                    <Td>{fmtDate(r.joined_at)}</Td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabEmbajadores({ ambassadors }: { ambassadors: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>Embajador</Th><Th>Email</Th><Th>Estado</Th><Th>Captados</Th><Th>Con suscripción</Th><Th>Comisión %</Th><Th>Comisión/mes est.</Th><Th>Alta</Th></tr></thead>
          <tbody>
            {ambassadors.length === 0
              ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin embajadores</td></tr>
              : ambassadors.map(a => (
                <tr key={a.ambassador_user_id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <Td><span className="font-medium">{a.display_name || '—'}</span></Td>
                  <Td>{a.email || '—'}</Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.status === 'active' ? 'Activo' : 'Inactivo'}</span></Td>
                  <Td>{a.restaurants_referred}</Td><Td>{a.active_subscriptions}</Td><Td>{a.commission_rate}%</Td>
                  <Td><span className={a.monthly_commission_cts > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>{(a.monthly_commission_cts / 100).toFixed(2)} €{a.monthly_commission_cts === 0 && <span className="text-[10px] text-gray-400 ml-1">(Stripe pendiente)</span>}</span></Td>
                  <Td>{fmtDate(a.applied_at)}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabMovimientos({ payments }: { payments: any[] }) {
  return (
    <div className="space-y-4">
      {payments.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          Sin movimientos registrados. Los pagos aparecerán aquí una vez que Stripe esté configurado y se realicen reservas de pago.
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>ID sesión Stripe</Th><Th>Importe</Th><Th>Estado</Th><Th>Fecha</Th></tr></thead>
            <tbody>
              {payments.length === 0
                ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Sin movimientos</td></tr>
                : payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <Td><span className="font-mono text-xs text-gray-500 truncate max-w-[160px] block">{p.stripe_session_id}</span></Td>
                    <Td><span className="font-semibold">{(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}</span></Td>
                    <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span></Td>
                    <Td>{fmtDate(p.created_at)}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">{children}</td>
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
