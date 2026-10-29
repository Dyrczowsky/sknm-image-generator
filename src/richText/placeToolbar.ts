const GAP = 8
const MARGIN = 8

export interface Box { top: number; bottom: number; left: number; right: number }

// Pozycja paska (fixed) względem zaznaczenia: nad nim, a bez miejsca pod nim;
// przycięta do okna z marginesem. null - zaznaczenie całkiem poza oknem.
export function placeToolbar(
  rect: Box,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number } | null {
  if (rect.bottom < 0 || rect.top > viewport.height || rect.right < 0 || rect.left > viewport.width) return null
  const above = rect.top - GAP - size.height
  const wanted = above >= MARGIN ? above : rect.bottom + GAP
  const maxTop = Math.max(MARGIN, viewport.height - MARGIN - size.height)
  const maxLeft = Math.max(MARGIN, viewport.width - MARGIN - size.width)
  const center = (rect.left + rect.right) / 2
  return {
    top: Math.min(Math.max(wanted, MARGIN), maxTop),
    left: Math.min(Math.max(center - size.width / 2, MARGIN), maxLeft),
  }
}
