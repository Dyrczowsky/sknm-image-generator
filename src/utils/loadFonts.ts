// Część `FontFaceSet`, której potrzebujemy (w testach - atrapa).
export type FontSet = Iterable<Pick<FontFace, 'load'>> & Pick<FontFaceSet, 'ready'>

// Wymusza pobranie WSZYSTKICH krojów z fonts.css. Samo `document.fonts.ready`
// potrafi się rozstrzygnąć, zanim przeglądarka w ogóle poprosi o kroje (na
// stronie nie ma jeszcze tekstu plakatu) - auto-dopasowanie liczyłoby wtedy
// rozmiary z fontu zastępczego. Krój, którego nie da się pobrać, nie blokuje
// gotowości (wynik i tak będzie sprawdzony przez `status` przed eksportem).
export async function loadAllFonts(fonts: FontSet): Promise<void> {
  await Promise.allSettled(Array.from(fonts, (face) => face.load()))
  await fonts.ready
}
