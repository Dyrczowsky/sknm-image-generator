// Rozmiar fontu, który zmniejsza PosterAutoFit: `fontSize: posterFit(30)`.
export function posterFit(px: number): string {
  return `calc(${px}px * var(--fit, 1))`
}

// Mnożnik `min` dla PosterAutoFit z najmniejszego rozmiaru w px: font `px`
// (już razem z suwakiem) zmniejsza się najwyżej do `floorPx`. Gdy font jest
// mniejszy od progu (suwak w dół), nie zmniejsza się wcale (1).
export function posterFitMin(floorPx: number, px: number): number {
  return px > 0 ? Math.min(1, floorPx / px) : 1
}

// Ile px od góry pudełka zostawić widoczne, żeby nie było widać uciętego
// wiersza: tekst zaczyna się `top` px od góry, wiersze mają `lineHeight` px.
// Zawsze co najmniej jeden wiersz (pudełko niższe niż wiersz - bez zmian).
export function wholeLinesHeight(boxHeight: number, top: number, lineHeight: number): number {
  if (!(lineHeight > 0) || boxHeight <= top + lineHeight) return boxHeight
  // Drobny zapas na zaokrąglenia przeglądarki (np. 40,6 px × 4 = 162,4).
  const lines = Math.floor((boxHeight - top + 0.5) / lineHeight)
  return Math.min(boxHeight, top + lines * lineHeight)
}
