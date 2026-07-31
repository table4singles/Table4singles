import { AlertCircle } from 'lucide-react'

export function ErrorBanner({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}
