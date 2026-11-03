import { toPlain } from '../../richText'
import type { RawPosterData } from '../../types'

// Czy baner pokaże linię wydarzenia (`BannerEventLine`): przełącznik włączony
// i choć jedna część wypełniona. Układ, który musi owinąć linię razem z
// tytułem, robi to tylko wtedy - bez niej HTML zostaje jak dawniej.
export function hasBannerEvent(data: RawPosterData): boolean {
  return Boolean(data.bannerShowEvent && (data.event_date || data.event_time || toPlain(data.location ?? '') !== ''))
}
