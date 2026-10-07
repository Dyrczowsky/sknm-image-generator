// Nawigacja strzałkami po grupie z „wędrującym" tabindexem (zakładki).
// Zwraca indeks pozycji, na którą ma przejść fokus, albo `null`, gdy klawisz
// nie dotyczy grupy. Pozycje wyłączone są pomijane, a końce się zawijają.
export function rovingTarget(key: string, current: number, enabled: readonly boolean[]): number | null {
  const count = enabled.length
  if (!enabled.some(Boolean)) return null

  const seek = (from: number, step: 1 | -1): number => {
    let index = from
    for (let i = 0; i < count; i++) {
      index = (index + step + count) % count
      if (enabled[index]) return index
    }
    return from
  }

  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return seek(current, 1)
    case 'ArrowLeft':
    case 'ArrowUp':
      return seek(current, -1)
    case 'Home':
      return seek(-1, 1)
    case 'End':
      return seek(count, -1)
    default:
      return null
  }
}
