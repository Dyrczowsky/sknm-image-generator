import { toPlain } from '../../richText'
import type { RawPosterData } from '../../types'

// Czy baner pokaże linię wydarzenia (`BannerEventLine`): przełącznik włączony
// i choć jedna część wypełniona. Układ, który musi owinąć linię razem z
// tytułem, robi to tylko wtedy - bez niej HTML zostaje jak dawniej.
// W edycji (`editable`) wystarczy przełącznik: pole miejsca zostaje na
// podglądzie także puste, żeby nie zniknęło spod kursora przy czyszczeniu.
export function hasBannerEvent(data: RawPosterData, editable = false): boolean {
  if (!data.bannerShowEvent) return false
  return editable || Boolean(data.event_date || data.event_time || toPlain(data.location ?? '') !== '')
}
