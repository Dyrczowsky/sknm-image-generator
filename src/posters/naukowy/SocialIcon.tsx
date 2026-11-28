import { Globe, Mail } from 'lucide-react'
import type { ContactField } from './blocks'

// lucide v1 nie ma ikon marek - proste wektorowe znaki w stylu obrysu lucide.
export function SocialIcon({ field, size = 22 }: { field: ContactField; size?: number }) {
  if (field === 'email') return <Mail size={size} />
  if (field === 'www') return <Globe size={size} />
  const box = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const
  if (field === 'instagram') {
    return (
      <svg {...box}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    )
  }
  const letter = field === 'facebook' ? 'f' : 'in'
  return (
    <svg {...box}>
      <rect x="3" y="3" width="18" height="18" rx={field === 'facebook' ? 9 : 3} />
      <text x="12" y="16.5" textAnchor="middle" fontSize={field === 'facebook' ? 14 : 11} fontWeight={800} fill="currentColor" stroke="none" fontFamily="inherit">{letter}</text>
    </svg>
  )
}
