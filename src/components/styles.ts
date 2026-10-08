// Klasy Tailwinda powtarzane w kilku komponentach edytora. Tailwind skanuje
// też ten plik, więc klasy trafiają do CSS jak wpisane wprost w JSX.

// Strona: jedna kolumna do 900px, szeroki układ powyżej.
export const PAGE_SHELL = 'mx-auto max-w-[720px] px-4 pt-8 pb-16 min-[900px]:max-w-[1240px]'

// Miniatura wgranej grafiki na białym tle.
export const IMAGE_THUMB = 'flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-lg border border-field-border bg-white'
export const IMAGE_THUMB_IMG = 'max-h-full max-w-full object-contain'

// Modal na natywnym <dialog> (szerokość maksymalną dokłada komponent).
export const DIALOG = 'm-auto w-[calc(100vw-2rem)] rounded-[14px] border border-border bg-surface text-fg [&::backdrop]:bg-black/50'
export const DIALOG_FIELD = 'w-full rounded-lg border border-field-border bg-field px-3 py-2 text-[0.9rem] text-fg'
export const DIALOG_LABEL = 'mb-1 block text-[0.8rem] font-semibold text-muted'
export const BUTTON_PRIMARY = 'rounded-lg bg-accent px-4 py-2 text-[0.9rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50'
export const BUTTON_GHOST = 'rounded-lg px-3 py-2 text-[0.9rem] text-muted hover:text-fg'


// ---------------------------------------------------------------------------
// Prymitywy interfejsu (`src/components/ui`). Nowy kod bierze komponenty
// stamtąd; stałe poniżej są dla nich wspólne i przydają się tam, gdzie wygląd
// kontrolki musi dostać inny element (`<a>`, `<label>` nad polem pliku).
// ---------------------------------------------------------------------------

export type ControlSize = 'sm' | 'md'
// `dangerSolid` to wyłącznie ostatni krok potwierdzenia (patrz ConfirmButton).
export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'dangerSolid'

// Wysokość kontrolek: na telefonie 40/44px (dotyk), od 900px gęściej - 36/40px.
// Przycisk i pole tego samego rozmiaru mają tę samą wysokość, więc stoją w rzędzie równo.
const CONTROL_HEIGHT: Record<ControlSize, string> = {
  sm: 'h-10 min-[900px]:h-9',
  md: 'h-11 min-[900px]:h-10',
}
const ICON_ONLY_WIDTH: Record<ControlSize, string> = {
  sm: 'w-10 px-0 min-[900px]:w-9',
  md: 'w-11 px-0 min-[900px]:w-10',
}
const BUTTON_SIZE: Record<ControlSize, string> = {
  sm: 'gap-1.5 px-3 text-[0.8125rem]',
  md: 'gap-2 px-4 text-[0.875rem]',
}

const BUTTON_BASE =
  'inline-flex flex-none cursor-pointer select-none items-center whitespace-nowrap rounded-lg border font-semibold leading-none no-underline transition-[background-color,border-color,color] duration-150 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress'

// Stan „wciśnięty" (`aria-pressed`) przełączników: tło + kolor akcentu; ikonę
// lub podpis zmienia komponent, żeby stan nie wisiał na samym kolorze.
const PRESSED = 'aria-pressed:border-transparent aria-pressed:bg-accent-soft aria-pressed:text-accent-text'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover',
  outline: `border-field-border bg-transparent text-fg hover:border-fg hover:bg-fg/[0.05] active:bg-fg/[0.1] ${PRESSED}`,
  ghost: `border-transparent bg-transparent text-fg hover:bg-fg/[0.07] active:bg-fg/[0.12] ${PRESSED}`,
  danger: 'border-field-border bg-transparent text-danger hover:border-danger hover:bg-danger-soft active:bg-danger-soft',
  dangerSolid: 'border-transparent bg-danger-solid text-on-accent hover:brightness-110 active:brightness-95',
}

interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ControlSize
  // Kwadrat na samą ikonę (IconButton).
  iconOnly?: boolean
  fullWidth?: boolean
  // Wyrównanie treści; `start` dla pozycji menu (przyciski na całą szerokość).
  align?: 'center' | 'start'
}

// Klasy przycisku. Komponent `Button` używa ich sam; wołaj wprost tylko dla
// elementu, który przyciskiem nie jest, a ma tak wyglądać, np.
// `<a href={routeHref('projects')} className={buttonClass({ variant: 'ghost' })}>`.
export function buttonClass({ variant = 'outline', size = 'sm', iconOnly = false, fullWidth = false, align = 'center' }: ButtonClassOptions = {}): string {
  const width = iconOnly ? ICON_ONLY_WIDTH[size] : BUTTON_SIZE[size]
  const justify = align === 'start' ? 'justify-start' : 'justify-center'
  return `${BUTTON_BASE} ${justify} ${CONTROL_HEIGHT[size]} ${width} ${BUTTON_VARIANT[variant]}${fullWidth ? ' w-full' : ''}`
}

// Jeden wygląd pola dla Input / Textarea / Select. Na telefonie tekst ma 16px
// (iOS nie przybliża strony przy fokusie), od 900px - 14px. Szerokości tu nie
// ma: w `Field` pole rozciąga się samo, poza nim dostaje ją od rodzica
// (`w-full`, `flex-1`, `w-44`) - bez konfliktu dwóch klas `w-*`. Fokus: globalny
// pierścień dosunięty do krawędzi pola. Błąd (`aria-invalid`) - czerwona ramka,
// a treść błędu z ikoną dokłada `Field`.
const FIELD_BASE =
  'min-w-0 rounded-lg border border-field-border bg-field text-base text-fg transition-[border-color,opacity] duration-150 placeholder:text-muted hover:border-fg focus-visible:border-accent focus-visible:-outline-offset-1 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger min-[900px]:text-[0.875rem]'
const FIELD_PADDING: Record<ControlSize, string> = { sm: 'px-2.5', md: 'px-3' }

type FieldKind = 'input' | 'textarea' | 'select'

// Klasy pola formularza - patrz `Input`, `Textarea`, `Select` w `ui/Input.tsx`.
export function fieldClass(kind: FieldKind = 'input', size: ControlSize = 'md'): string {
  if (kind === 'textarea') return `${FIELD_BASE} ${FIELD_PADDING[size]} min-h-[5.5rem] resize-y py-2 leading-normal`
  const select = kind === 'select' ? ' w-full cursor-pointer appearance-none pr-9' : ''
  return `${FIELD_BASE} ${CONTROL_HEIGHT[size]} ${FIELD_PADDING[size]}${select}`
}

// Teksty wokół pola (etykieta, podpowiedź, błąd) i nagłówek grupy pól.
export const UI_LABEL = 'text-[0.8125rem] font-semibold leading-tight text-fg'
export const UI_HINT = 'm-0 text-[0.8125rem] leading-snug text-muted'
export const UI_ERROR = 'm-0 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-danger'
export const UI_HEADING = 'm-0 text-[0.9375rem] font-bold leading-tight text-fg'

// Powierzchnia wysuwanego panelu (Popover): menu, pomoc, wybór z listy.
export const POPOVER_PANEL = 'rounded-xl border border-border bg-surface p-3 text-[0.875rem] text-fg shadow-pop'

// Kafelek wyboru z miniaturą (szablon, kolorystyka). Stan wybrania
// (`aria-pressed`) to ramka, tło i znaczek `CHOICE_MARK` w rogu miniatury -
// nie sam kolor. Ramka jest zawsze, więc wybór niczego nie przesuwa.
export const CHOICE_TILE =
  'flex min-w-0 cursor-pointer select-none flex-col items-center gap-1.5 rounded-lg border-2 border-transparent bg-transparent p-1 pb-1.5 text-[0.8125rem] font-medium leading-tight text-muted transition-colors duration-150 hover:bg-fg/[0.06] hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:font-semibold aria-pressed:text-fg'
export const CHOICE_MARK =
  'absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_0_0_2px_rgb(255_255_255/0.9)]'

// Ukrycie BEZ wyłączania układu: element wyjeżdża poza lewą krawędź okna, ale
// dalej jest rozmieszczany. Tak chowamy wszystko, co zawiera podgląd plakatu -
// eksport kopiuje obliczone style węzła, a pod `display: none` przeglądarka
// ich nie rozwiązuje (plik wychodził wtedy z minimalnie innym wygładzaniem
// tekstu); `visibility: hidden` z kolei dziedziczy się na kopię i daje pusty
// plik. Element ukryty w ten sposób MUSI dostać atrybut `inert` (fokus,
// czytniki ekranu). `NARROW_OFFSCREEN` działa tylko poniżej 900 px.
//
// JEDNA granica układu: 900 px. Tailwind 4 kompiluje `min-[900px]:` do
// `@media (width >= 900px)`, a `max-[900px]:` do `@media not all and (width >= 900px)`,
// czyli dokładnie dopełnienia (`width < 900px`) - bez luki przy ułamkowych
// szerokościach (zoom). Dlatego „wąsko" pisze się `max-[900px]:`, nie
// z liczbą o 1 mniejszą (to `width < 899px` i zostawia pasmo 899-900 px bez układu).
// `NARROW_QUERY` to to samo dopełnienie dla `matchMedia` (atrybut `inert` w JS).
export const NARROW_QUERY = 'not all and (min-width: 900px)'
export const OFFSCREEN = 'pointer-events-none fixed top-0 left-[-200vw] w-screen'
export const NARROW_OFFSCREEN = 'max-[900px]:pointer-events-none max-[900px]:fixed max-[900px]:top-0 max-[900px]:left-[-200vw] max-[900px]:w-screen'
