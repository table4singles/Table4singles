interface PageHeaderProps {
  title: string
  subtitle?: string
  variant?: 'user' | 'restaurant'
  action?: React.ReactNode
}

/** Gradient hero band used at the top of every internal page, echoing the
 * landing hero. `variant` differentiates the user app (sky→orange) from the
 * restaurant management side (indigo→amber) so switching modes feels distinct. */
export function PageHeader({ title, subtitle, variant = 'user', action }: PageHeaderProps) {
  const gradient = variant === 'restaurant'
    ? 'from-indigo-600 via-violet-500 to-amber-400'
    : 'from-sky-500 via-sky-400 to-orange-300'

  return (
    <div className={`-mx-4 sm:mx-0 sm:rounded-3xl overflow-hidden bg-gradient-to-r ${gradient} px-4 sm:px-8 py-7 mb-6`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-white/90 text-sm mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
