import { Icon } from './ui'

interface AssetThumbProps {
  // Data URL miniatury albo `undefined`, gdy obraz jeszcze się nie wczytał.
  src: string | undefined
  // Logotyp mieści się w całości na białym tle, zdjęcie wypełnia pole.
  fit: 'contain' | 'cover'
  // Wysokość i kształt pola (np. `aspect-[4/3]`, `h-14`).
  className?: string
}

// Miniatura grafiki z biblioteki (Grafiki, wybór logotypu): obraz albo neutralny
// placeholder do czasu wczytania. Pole jest zawsze to samo, więc siatka nie skacze.
export function AssetThumb({ src, fit, className = 'aspect-[4/3]' }: AssetThumbProps) {
  return (
    <span
      className={`flex w-full items-center justify-center overflow-hidden rounded-lg border border-border ${src ? 'bg-white' : 'bg-sunken text-muted'} ${className}`}
      {...(src ? {} : { 'data-placeholder': '' })}
    >
      {src ? <img className={fit === 'cover' ? 'size-full object-cover' : 'max-h-full max-w-full object-contain p-1'} src={src} alt="" /> : <Icon name="image" size="lg" />}
    </span>
  )
}
