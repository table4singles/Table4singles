import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ className = 'py-16' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  )
}
