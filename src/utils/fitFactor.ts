// Wspólne dla slajdów (AutoFit) i plakatów (PosterAutoFit).

// Największy mnożnik z [min, 1], przy którym treść się mieści (wyszukiwanie
// binarne, zakłada monotoniczność: mniejszy font nigdy nie przepełnia
// bardziej). `overflowing` = nie mieści się nawet przy `min`.
export function findFitFactor(
  overflowsAt: (factor: number) => boolean,
  min = 0.7,
  iterations = 7,
): { factor: number; overflowing: boolean } {
  const floor = Math.min(Math.max(min, 0.01), 1)
  if (!overflowsAt(1)) return { factor: 1, overflowing: false }
  if (overflowsAt(floor)) return { factor: floor, overflowing: true }
  // `fits` zawsze się mieści, `over` zawsze przepełnia.
  let fits = floor
  let over = 1
  for (let i = 0; i < iterations; i++) {
    const mid = (fits + over) / 2
    if (overflowsAt(mid)) over = mid
    else fits = mid
  }
  // W dół, nie do najbliższej - zaokrąglenie w górę mogłoby znów przepełnić.
  return { factor: Math.max(floor, Math.floor(fits * 1000) / 1000), overflowing: false }
}

// Czy treść wychodzi poza pudełko. Nie `scrollHeight`: nagłówki mają
// interlinię ~1,04, ciaśniejszą niż obszar treści fontu, więc przeglądarka
// zawsze liczy kilka px „przewijania", nawet gdy nic nie jest ucięte - i każdy
// nagłówek spadał do minimum z ostrzeżeniem. Bierzemy więc pudełka układu
// dzieci (offset*, bez transformacji kroków „pokazuj po kolei"); pudełko AutoFit
// ma `position: relative`, więc to ono jest ich offsetParent.
export function contentOverflows(el: HTMLElement): boolean {
  let bottom = 0
  let right = 0
  for (const child of Array.from(el.children)) {
    if (!(child instanceof HTMLElement)) continue
    const margin = parseFloat(getComputedStyle(child).marginBottom) || 0
    bottom = Math.max(bottom, child.offsetTop + child.offsetHeight + margin)
    right = Math.max(right, child.offsetLeft + child.offsetWidth)
  }
  // Tekst wpisany wprost w pudełko (bez elementu) - zostaje stara miara.
  const looseText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
  if (looseText) return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
  return bottom > el.clientHeight + 1 || right > el.clientWidth + 1
}
