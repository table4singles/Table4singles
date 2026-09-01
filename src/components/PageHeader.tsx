interface PageHeaderProps {
  title: string
  subtitle?: string
  variant?: 'user' | 'restaurant'
  action?: React.ReactNode
}

/** Gradient hero band used at the top of every internal page, echoing the
 * dark+gold landing hero. `variant` differentiates the user app (coral→gold)
 * from the restaurant management side (gold→coral) so switching modes feels
 * distinct while staying in the same coral/gold palette as the landings —
 * stops stay in the 500-700 range on both ends so white text keeps enough
 * contrast throughout. */
export function PageHeader({ title, subtitle, variant = 'user', action }: PageHeaderProps) {
  const gradient = variant === 'restaurant'
    ? 'from-gold-700 via-gold-600 to-primary-600'
    : 'from-primary-600 via-primary-500 to-gold-500'

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
