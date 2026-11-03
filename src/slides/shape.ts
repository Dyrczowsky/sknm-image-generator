import type { SlideAspect } from './types'

// Rozmiar układu slajdu w px (jak w prezentacji wzorcowej). Podgląd i eksport
// skalują ten układ - komponenty zawsze piszą w tych jednostkach.
export const SLIDE_SIZE: Record<SlideAspect, { width: number; height: number }> = {
  '16:9': { width: 1600, height: 900 },
  '1:1': { width: 1200, height: 1200 },
}

export const ASPECTS: readonly { aspect: SlideAspect; label: string }[] = [
  { aspect: '16:9', label: '16:9' },
  { aspect: '1:1', label: '1:1' },
]
