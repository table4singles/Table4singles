// Palette drawn from tailwind.config.js's own extended/default scales — nothing
// invented outside what the app already uses elsewhere (coral primary, gold accent,
// plus the sky/indigo/violet/emerald/amber/rose already seen in nav toggles, badges
// and gradients across the app).
const AVATAR_COLORS = [
  'bg-primary-500',
  'bg-gold-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function initialsFor(name?: string | null): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[1][0] : ''
  return (first + second).toUpperCase() || '?'
}

interface AvatarProps {
  /** photo_url / avatar_url — real photo shown when present. */
  src?: string | null
  /** display_name / restaurant_name / full_name — drives initials + color. */
  name?: string | null
  /** Sizing classes for the avatar box itself, e.g. "w-12 h-12" or "w-full h-full". */
  className?: string
  /** Font-size class for the initials fallback, e.g. "text-sm". */
  textClassName?: string
  /** 'contain' for logos that shouldn't be cropped (restaurant avatars), 'cover' for photos. */
  fit?: 'cover' | 'contain'
  alt?: string
}

/** Shared avatar used everywhere a profile/restaurant photo is shown. Renders the
 * real photo when available; otherwise a color circle with the name's initials —
 * the color is deterministic per name, so the same person always gets the same
 * color — instead of a flat gray placeholder icon. */
export function Avatar({ src, name, className = 'w-10 h-10', textClassName = 'text-sm', fit = 'cover', alt = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || ''}
        className={`${className} rounded-full flex-shrink-0 ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
      />
    )
  }

  const key = (name ?? '').trim() || '?'
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length]
  const initials = initialsFor(name)

  return (
    <div
      className={`${className} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ${color} ${textClassName}`}
      aria-label={alt || name || undefined}
    >
      {initials}
    </div>
  )
}
