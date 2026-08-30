/** Small line-art illustration (plate + crossed fork/knife + candle) used across
 * empty states, echoing the app's fork/knife logo mark instead of a generic icon-in-circle. */
export function EmptyStateIllustration({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className}>
      <circle cx="48" cy="54" r="30" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" />
      <line x1="36" y1="40" x2="36" y2="52" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="40" x2="33" y2="48" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="40" x2="39" y2="48" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 52c0 7-3 8-3 14" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M60 40c-3 0-5 3-5 7s2 6 5 6v13" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="63" y="26" width="3" height="14" rx="1.5" className="fill-primary-500" />
      <path d="M64.5 20c2 2 2 4 0 6c-2-2-2-4 0-6Z" className="fill-primary-300" />
    </svg>
  )
}
