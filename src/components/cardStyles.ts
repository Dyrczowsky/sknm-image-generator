// Wspólne klasy kart (Projekty, Historia, Grafiki): ten sam rytm siatki,
// ramka i pole miniatury.

// Siatka kart: od jednej kolumny na telefonie do czterech w ramie 1040 px.
export const CARD_GRID = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-0'

// Karta; `highlight` obrysowuje ją akcentem (otwarty projekt).
export const cardClass = (highlight = false) =>
  `flex min-w-0 flex-col overflow-hidden rounded-xl border bg-surface ${highlight ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-border'}`

// Pole miniatury u góry karty: tło „pod stroną", miniatura wyśrodkowana.
export const THUMB_FIELD = 'flex h-[15rem] w-full items-center justify-center bg-sunken p-4'

// Bok pola, w które wpisujemy miniaturę plakatu (dłuższy bok).
export const THUMB_BOX = 208
