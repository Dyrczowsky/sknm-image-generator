import { colors } from './theme'
import type { LogoVariant, ResolvedScheme, SygnetName } from '../types'

// Blok jednego schematu: dowolne role kolorów + opcjonalny sygnet/logoVariant.
interface SchemeBlock {
  sygnet?: SygnetName
  logoVariant?: LogoVariant
  [role: string]: string | undefined
}
type LayoutSchemes = Record<string, SchemeBlock>

// Schematy kolorów są ZAGNIEŻDŻONE per layout, bo „granat" Wykładu (biały na
// granacie) to nie to samo co „granat" Warsztatu (granat na kremie). Każdy
// layout ma blok bazowy (`default`, a gdy go brak — pierwszy schemat, jak w
// Rekrutacji i Gali) + nazwane schematy nadpisujące tylko różnice.
// Bloki layoutów są poniżej, jeden na layout.
// UWAGA: rola nieobecna w `default` danego layoutu nie renderuje pustki —
// `var(--<rola>)` spada do wartości z `:root` w src/index.css (np. `--accent`
// koliduje z firmowym niebieskim aplikacji), więc każda rola używana przez
// plakat musi istnieć w jego bloku `default`.

const ogloszenie: LayoutSchemes = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark' },
  czernZolta:        { pageBg: colors.black, accent: colors.lime,      sygnet: 'negatywny' },
  czernPomaranczowa: { pageBg: colors.black, accent: colors.coral,     sygnet: 'negatywny' },
  czernGranatowa:    { pageBg: colors.black, accent: colors.navyLight, sygnet: 'negatywny' },
  okazjonalnyZloty:   { accent: colors.gold,   sygnet: 'zloty' },
  okazjonalnySrebrny: { accent: colors.silver, sygnet: 'srebrny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
}

// Gala — bez bloku `default`; bazą jest pierwszy schemat `okazjonalnyZloty`
// (patrz baseBlock). `okazjonalnySrebrny` nadpisuje tylko rolę `gold`
// (niesie wtedy srebro) i sygnet; resztę dziedziczy z bazy.
const gala: LayoutSchemes = {
  okazjonalnyZloty: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    gold: colors.silver,
    sygnet: 'srebrny',
  },
}

// Gość — `accent` obsługuje naraz tło narożnego trójkąta, kolor tekstu Badge
// i kolor linku „Wstęp wolny". Pudełko z datą (coral/cream) jest identyczne we
// wszystkich schematach, więc zostaje literałem w komponencie (nie rolą).
const gosc: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light' },
  czernZolta:        { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.lime,      sygnet: 'negatywny', logoVariant: 'dark' },
  czernPomaranczowa: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.coral,     sygnet: 'negatywny', logoVariant: 'dark' },
  czernGranatowa:    { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.navyLight, sygnet: 'negatywny', logoVariant: 'dark' },
  okazjonalnyZloty:   { pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted,
                        accent: colors.gold,   sygnet: 'zloty',   logoVariant: 'dark' },
  okazjonalnySrebrny: { pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted,
                        accent: colors.silver, sygnet: 'srebrny', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark },
}

// Data — liczba jako grafika. Etykieta miesiąca jest koralowa we wszystkich
// sześciu wariantach, więc zostaje literałem w komponencie (nie rolą). Trzy
// dekoracyjne trójkąty na dole to role `tri1`/`tri2`/`tri3`.
const data: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.navy, mutedText: colors.textMuted,
             title: colors.ink, tri1: colors.navy, tri2: colors.lime, tri3: colors.coral,
             sygnet: 'granat', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.lime, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'negatywny', logoVariant: 'dark' },
  okazjonalnyZloty: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'zloty', logoVariant: 'dark' },
  okazjonalnySrebrny: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.silver, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'srebrny', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, title: colors.slate,
           tri1: colors.grayDark, tri2: colors.gray, sygnet: 'szary' },
}

// Wykład — typografia. `badgeFill`/`badgeText` to wypełniona plakietka,
// `speaker` kolor nazwiska prelegenta, `chips` stos trzech trójkątów w lewym
// dolnym rogu. Dekoracyjne kliny (`washTop`, `wedgeBr`, `wedgeBl`) mają jawne
// hex/rgba per schemat — bez color-mix. `wedgeBr` niesie tylko kolor; jego
// `opacity: 0.42` zostaje w JSX. Warianty `czernZolta/Pomaranczowa/Granatowa`
// biorą sygnet negatywny; `okazjonalnyZloty` daje czarne tło + złoty sygnet
// (nie nadpisuje granatu z `default`).
const wyklad: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernZolta: { pageBg: colors.black, badgeFill: colors.lime, badgeText: colors.limeText,
           speaker: colors.lime, chips: colors.lime,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  czernPomaranczowa: { pageBg: colors.black, badgeFill: colors.coral, badgeText: colors.cream,
           speaker: colors.coral, chips: colors.coral,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  czernGranatowa: { pageBg: colors.black, badgeFill: colors.navyLight, badgeText: colors.cream,
           speaker: colors.navyLight, chips: colors.navyLight,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  okazjonalnyZloty: { pageBg: colors.black, badgeFill: colors.gold, badgeText: colors.cream,
           speaker: colors.gold, chips: colors.gold,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'zloty' },
  okazjonalnySrebrny: { pageBg: colors.black, badgeFill: colors.silver, badgeText: colors.ink,
           speaker: colors.silver, chips: colors.silver,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'srebrny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText,
           badgeFill: colors.navy, badgeText: colors.cream, speaker: colors.navy, chips: colors.navy,
           washTop: 'rgba(60,69,155,.05)', wedgeBr: '#E2DED3', wedgeBl: '#DAD5C8',
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate,
           badgeFill: colors.grayDark, badgeText: colors.cream, speaker: colors.grayDark, chips: colors.gray,
           washTop: 'rgba(138,141,143,.08)', wedgeBr: '#D8D4CA', wedgeBl: '#CFCAC0',
           sygnet: 'szary', logoVariant: 'light' }
}

// Konferencja — nagłówkowa banda + lista programu. `panel`/`panelText` to pas
// nagłówka (tło/tekst), `headerBadge` plakietka w nagłówku, `footerBadge`
// plakietka w stopce. `lineFirst` to `borderTop` pierwszego wiersza programu,
// `lineRest` wszystkie pozostałe + końcowa kreska — w wariantach na ciemnym
// tle to jawna rgba, nie token. Etykiety godzin w programie są koralowe we
// wszystkich ośmiu wariantach, więc zostają literałem w komponencie (nie rolą).
const konferencja: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czernZolta: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.lime,
    lineFirst: colors.lime, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.lime,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernPomaranczowa: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.coral,
    lineFirst: colors.coral, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.coral,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernGranatowa: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.navyLight,
    lineFirst: colors.navyLight, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.navyLight,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  okazjonalnyZloty: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.silver,
    lineFirst: colors.silver, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.silver,
    sygnet: 'srebrny', logoVariant: 'dark',
  },
  jasny: { pageBg: colors.paper },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    panel: colors.grayDark, headerBadge: colors.cream,
    lineFirst: colors.grayDark, footerBadge: colors.grayDark,
    sygnet: 'szary',
  },
}

// Rekrutacja — wzór z sygnetu. DOMYŚLNY schemat to `limonka` (limonkowa strona),
// nie `default`. `band` to tło dolnej bandy-zygzaka, `subColor` kolor podtytułu
// (gra też rolę mutedText — Rekrutacja NIE ma osobnej roli `mutedText`),
// `footerText` kolor wrappera dolnego bloku info, `badgeColor` tekst plakietki
// `Badge`, `qrBorder`/`qrText` obwódka/etykieta pudełka QR. Długi `clipPath`
// bandy jest identyczny we wszystkich wariantach — rolą jest tylko `background`.
// Rekrutacja nie ma bloku `default`: resolver scala nazwany schemat nad
// pierwszym schematem `limonka`, więc bez tej bazy `czern*`/`jasny`/`szary` nie
// odziedziczyłyby wspólnych ról (`footerText`, `qrBorder`, `qrText`, `logoVariant`).
const rekrutacja: LayoutSchemes = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
  },
  czernZolta: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.lime, subColor: colors.creamMuted, footerText: colors.limeText,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czernPomaranczowa: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.coral, subColor: colors.creamMuted, footerText: colors.limeText,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czernGranatowa: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.navyLight, subColor: colors.creamMuted, footerText: colors.cream,
    badgeColor: colors.cream,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  okazjonalnyZloty: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.gold, subColor: colors.creamMuted, footerText: colors.ink,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'zloty', logoVariant: 'light',
  },
  okazjonalnySrebrny: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.silver, subColor: colors.creamMuted, footerText: colors.ink,
    badgeColor: colors.ink,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'srebrny', logoVariant: 'light',
  },
  jasny: {
    pageBg: colors.paper, pageText: colors.navy,
    subColor: colors.textMuted, badgeColor: colors.lime,
    sygnet: 'granat',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    band: colors.grayDark, subColor: colors.textMuted, badgeColor: colors.cream,
    sygnet: 'szary',
  },
}
// Rekrutacja nie ma bloku `default` - bazą jest jej pierwszy schemat `limonka`
// (patrz baseBlock), więc `czern*`/`jasny`/`szary` dziedziczą wspólne role z niego.

// Warsztat — najbogatszy zestaw ról. Lokalny komponent `Pill` bierze
// `pillFill`/`pillText`, wypełniona plakietka `badgeFill`/`badgeText`, wielki
// tytuł `title`. `slotBg` obsługuje naraz tło pudełka QR i podkładki obu logo.
// `qrBorder`/`qrText` to obwódka/etykieta pudełka QR — w `default`/`jasny`/
// `szary` równe własnym domyślnym `PlaceholderBox` (placeholderBorder/Text),
// w wariantach na ciemnym tle jawna rgba. `jasny` nadpisuje tylko tło strony i podkładek.
const warsztat: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.navy, badgeText: colors.lime,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
  },
  czernZolta: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.lime, badgeText: colors.limeText,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernPomaranczowa: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.coral, badgeText: colors.cream,
    pillFill: colors.coral, pillText: colors.cream, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernGranatowa: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.navyLight, badgeText: colors.cream,
    pillFill: colors.navyLight, pillText: colors.cream, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  okazjonalnyZloty: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.ink,
    pillFill: colors.gold, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.silver, badgeText: colors.ink,
    pillFill: colors.silver, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'srebrny', logoVariant: 'dark',
  },
  jasny: {
    pageBg: colors.paper, slotBg: colors.paper,
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    title: colors.slate, badgeFill: colors.grayDark, badgeText: colors.cream,
    pillFill: colors.gray, pillText: colors.slate, slotBg: colors.paper,
    sygnet: 'szary',
  },
}

export const schemes: Record<string, LayoutSchemes> = { ogloszenie, gala, gosc, data, wyklad, konferencja, rekrutacja, warsztat }

// camelCase → --kebab; layout może dodać dowolną rolę bez zmiany resolvera.
const roleToVar = (k: string): `--${string}` => `--${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`
const NON_CSS = new Set(['sygnet', 'logoVariant'])

// Nazwy schematów danego layoutu w kolejności zapisu w `schemes.ts` = kolejność
// swatchy na pasku kolorystyki. Pierwsza pozycja to schemat domyślny. Layout
// z jednym wpisem nie pokazuje paska.
export function schemesFor(layoutKey: string): string[] {
  return Object.keys(schemes[layoutKey] ?? {})
}

// Blok bazowy layoutu: `default`, a gdy layout go nie ma (np. Rekrutacja) -
// jego pierwszy schemat. Nazwane schematy nadpisują nad nim tylko różnice.
function baseBlock(layout: LayoutSchemes): SchemeBlock {
  return layout.default ?? layout[Object.keys(layout)[0]] ?? {}
}

// Scala nazwany schemat nad blokiem bazowym layoutu. Nieznany layout / schemat
// → pusty wynik / sama baza.
export function resolveScheme(layoutKey: string, name: string | undefined): ResolvedScheme {
  const layout = schemes[layoutKey] ?? {}
  const merged: SchemeBlock = { ...baseBlock(layout), ...(name ? layout[name] ?? {} : {}) }
  const cssVars: Record<`--${string}`, string> = {}
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && !NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return {
    cssVars,
    sygnet: merged.sygnet,
    logoVariant: merged.logoVariant,
  }
}

// Podpisy swatchy kolorystyki w UI. Brak wpisu → swatch pokazuje surowy klucz
// schematu, więc każdą nową nazwę dopisz tutaj.
export const SCHEME_LABELS: Record<string, string> = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  czernZolta: 'Czerń żółta',
  czernPomaranczowa: 'Czerń pomarańczowa',
  czernGranatowa: 'Czerń granatowa',
  okazjonalnyZloty: 'Okazjonalny złoty',
  okazjonalnySrebrny: 'Okazjonalny srebrny',
  jasny: 'Jasny',
  szary: 'Szary',
}
