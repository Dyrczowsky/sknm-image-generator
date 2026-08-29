// MOST na czas migracji — deklaracja typów dla wciąż-JSX-owego ImageUpload,
// żeby LogoField/PhotoGalleryField (już .tsx) type-checkowały się na strict.
// Task 8 konwertuje ImageUpload.jsx → .tsx z własnym ImageUploadProps i usuwa
// ten plik. Kształt jest 1:1 z ImageUploadProps z briefu Task 8.
import type { FunctionComponent } from 'react'

interface ImageUploadProps {
  label: string
  hint?: string
  value: string | null
  onChange: (src: string | null) => void
  enabled?: boolean
  onEnabledChange?: (checked: boolean) => void
  position?: { x: number; y: number }
  onPositionChange?: (partial: { x?: number; y?: number }) => void
}

export const ImageUpload: FunctionComponent<ImageUploadProps>
