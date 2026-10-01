// Rozdzielczości druku próbowane po kolei. Przeglądarki ograniczają rozmiar
// canvasu (A2 przy 300 dpi to ~35 MP), więc gdy rasteryzacja zawiedzie,
// schodzimy niżej zamiast oddać pusty plik.
export const DPI_LADDER: readonly number[] = [300, 200, 150]

export async function withDpiLadder<T>(
  dpis: readonly number[],
  attempt: (dpi: number) => Promise<T>,
): Promise<{ dpi: number; result: T }> {
  let lastError: unknown = new Error('brak rozdzielczości do wypróbowania')
  for (const dpi of dpis) {
    try {
      return { dpi, result: await attempt(dpi) }
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}
