// Klasy Tailwinda powtarzane w kilku komponentach edytora. Tailwind skanuje
// też ten plik, więc klasy trafiają do CSS jak wpisane wprost w JSX.

// Strona: jedna kolumna do 900px, szeroki układ powyżej.
export const PAGE_SHELL = 'mx-auto max-w-[720px] px-4 pt-8 pb-16 min-[900px]:max-w-[1240px]'

// Sekcja formularza oddzielona kreską od pól nad nią.
export const FORM_SECTION = 'mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]'

export const CHECKBOX = 'h-[15px] w-[15px] flex-none cursor-pointer accent-accent'

// Kompaktowe pole tekstowe (wiersze list, link do kodu QR).
export const COMPACT_INPUT = 'rounded-lg border border-field-border bg-field px-3 py-[9px] text-[0.9rem] text-fg'

// Etykieta-przycisk nakrywająca niewidoczny <input type="file"> (wymaga `relative`).
export const FILE_PICKER = 'cursor-pointer rounded-lg border border-field-border px-4 py-[9px] text-[0.85rem] transition-[border-color,background-color] hover:border-accent hover:bg-accent-soft'
export const FILE_PICKER_INPUT = 'absolute inset-0 cursor-pointer opacity-0'

// Miniatura wgranej grafiki na białym tle.
export const IMAGE_THUMB = 'flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-lg border border-field-border bg-white'
export const IMAGE_THUMB_IMG = 'max-h-full max-w-full object-contain'

// Modal na natywnym <dialog> (szerokość maksymalną dokłada komponent).
export const DIALOG = 'm-auto w-[calc(100vw-2rem)] rounded-[14px] border border-border bg-surface text-fg [&::backdrop]:bg-black/50'
export const DIALOG_FIELD = 'w-full rounded-lg border border-field-border bg-field px-3 py-2 text-[0.9rem] text-fg'
export const DIALOG_LABEL = 'mb-1 block text-[0.8rem] font-semibold text-muted'
export const BUTTON_PRIMARY = 'rounded-lg bg-accent px-4 py-2 text-[0.9rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50'
export const BUTTON_GHOST = 'rounded-lg px-3 py-2 text-[0.9rem] text-muted hover:text-fg'

// Mały przycisk akcji w wierszu listy (historia, notatki); kolor hovera dokłada komponent.
export const ROW_ACTION = 'cursor-pointer rounded-lg border border-field-border bg-transparent px-3 py-[7px] text-[0.8rem] text-fg transition-[border-color,color]'
