import { X, User } from 'lucide-react'

interface CommensalProfile {
  id?: string
  display_name: string | null
  avatar_url: string | null
}

interface CommensalModalProps {
  profile: CommensalProfile
  onClose: () => void
}

export function CommensalModal({ profile, onClose }: CommensalModalProps) {
  const initials = (profile.display_name ?? 'U').charAt(0).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-md flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400 dark:text-gray-300">
                {initials}
              </span>
            )}
          </div>

          <div>
            <p className="text-lg font-display font-bold text-gray-900 dark:text-white">
              {profile.display_name || 'Comensal'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Comensal confirmado</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
