// Rozmiar fontu, który zmniejsza PosterAutoFit: `fontSize: posterFit(30)`.
export function posterFit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}
