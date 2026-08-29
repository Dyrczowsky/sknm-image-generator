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
// layout ma pełny blok `default` + nazwane schematy nadpisujące tylko różnice.
// Bloki layoutów są poniżej, jeden na layout.
// UWAGA: rola nieobecna w `default` danego layoutu nie renderuje pustki —
// `var(--<rola>)` spada do wartości z `:root` w src/index.css (np. `--accent`
// koliduje z firmowym niebieskim aplikacji), więc każda rola używana przez
// plakat musi istnieć w jego bloku `default`.

const ogloszenie: LayoutSchemes = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark' },
  czern: { pageBg: colors.black, accent: colors.gold, sygnet: 'negatywny' },
  zloto: { accent: colors.gold, sygnet: 'zloty' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
}

const gala: LayoutSchemes = {
  default: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    patronBorder: 'rgba(184,148,58,.5)', patronText: 'rgba(240,237,228,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
}

// Gość — `accent` obsługuje naraz tło narożnego trójkąta, kolor tekstu Badge
// i kolor linku „Wstęp wolny". Pudełko z datą (coral/cream) jest identyczne we
// wszystkich schematach, więc zostaje literałem w komponencie (nie rolą).
const gosc: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.gold, sygnet: 'negatywny', logoVariant: 'dark' },
  zloto: { pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.gold, sygnet: 'zloty', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark },
}

// Data — liczba jako grafika. Etykieta miesiąca jest koralowa we wszystkich
// pięciu wariantach, więc zostaje literałem w komponencie (nie rolą). Trzy
// dekoracyjne trójkąty na dole to role `tri1`/`tri2`/`tri3`.
const data: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.navy, mutedText: colors.textMuted,
             title: colors.ink, tri1: colors.navy, tri2: colors.lime, tri3: colors.coral,
             sygnet: 'granat', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'negatywny', logoVariant: 'dark' },
  zloto: { pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'zloty', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, title: colors.slate,
           tri1: colors.grayDark, tri2: colors.gray, sygnet: 'szary' },
}

// Wykład — typografia. `badgeFill`/`badgeText` to wypełniona plakietka,
// `speaker` kolor nazwiska prelegenta, `chips` stos trzech trójkątów w lewym
// dolnym rogu. Dekoracyjne kliny (`washTop`, `wedgeBr`, `wedgeBl`) mają jawne
// hex/rgba per schemat — bez color-mix. `wedgeBr` niesie tylko kolor; jego
// `opacity: 0.42` zostaje w JSX. Wariant czerń bierze sygnet negatywny (nie
// złoty), a złoto NIE nadpisuje `pageBg` (zostaje granat).
const wyklad: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: { badgeFill: colors.gold, badgeText: colors.cream, speaker: colors.cream,
           chips: colors.gold, sygnet: 'zloty' },
  czern: { pageBg: colors.black, badgeFill: colors.gold, badgeText: colors.cream,
           speaker: colors.gold, chips: colors.gold,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText,
           badgeFill: colors.navy, badgeText: colors.cream, speaker: colors.navy, chips: colors.navy,
           washTop: 'rgba(60,69,155,.05)', wedgeBr: '#E2DED3', wedgeBl: '#DAD5C8',
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate,
           badgeFill: colors.grayDark, badgeText: colors.cream, speaker: colors.grayDark, chips: colors.gray,
           washTop: 'rgba(138,141,143,.08)', wedgeBr: '#D8D4CA', wedgeBl: '#CFCAC0',
           sygnet: 'szary', logoVariant: 'light' },
}

// Konferencja — nagłówkowa banda + lista programu. `panel`/`panelText` to pas
// nagłówka (tło/tekst), `headerBadge` plakietka w nagłówku, `footerBadge`
// plakietka w stopce. `lineFirst` to `borderTop` pierwszego wiersza programu,
// `lineRest` wszystkie pozostałe + końcowa kreska — w czerni i złocie to jawna
// rgba, nie token. Etykiety godzin w programie są koralowe we wszystkich
// pięciu wariantach, więc zostają literałem w komponencie (nie rolą).
const konferencja: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'zloty', logoVariant: 'dark',
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
// Alias `rekrutacja.default = rekrutacja.limonka` niżej: resolver scala nazwany
// schemat nad `default`, więc bez aliasu `zloto`/`jasny`/`szary` nie
// odziedziczyłyby wspólnych ról (`footerText`, `qrBorder`, `qrText`, `logoVariant`).
const rekrutacja: LayoutSchemes = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.gold, subColor: colors.creamMuted, footerText: colors.ink,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
  },
  zloto: {
    pageBg: colors.gold, pageText: colors.ink,
    band: colors.navy, subColor: colors.navyDark, badgeColor: colors.gold,
    sygnet: 'zloty',
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
rekrutacja.default = { ...rekrutacja.limonka }

// Warsztat — najbogatszy zestaw ról. Lokalny komponent `Pill` bierze
// `pillFill`/`pillText`, wypełniona plakietka `badgeFill`/`badgeText`, wielki
// tytuł `title`. `slotBg` obsługuje naraz tło pudełka QR i podkładki obu logo.
// `qrBorder`/`qrText` to obwódka/etykieta pudełka QR — w `default`/`jasny`/
// `szary` równe własnym domyślnym `PlaceholderBox` (placeholderBorder/Text),
// w czerni i złocie jawna rgba. `jasny` nadpisuje tylko tło strony i podkładek.
const warsztat: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.navy, badgeText: colors.lime,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.black,
    pillFill: colors.gold, pillText: colors.black, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  zloto: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.ink,
    pillFill: colors.gold, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
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

// Scala nazwany schemat nad `default` danego layoutu. Nieznany layout / schemat
// → pusty wynik / sam `default`.
export function resolveScheme(layoutKey: string, name: string | undefined): ResolvedScheme {
  const layout = schemes[layoutKey] ?? {}
  const merged: SchemeBlock = { ...(layout.default ?? {}), ...(name ? layout[name] ?? {} : {}) }
  const cssVars: Record<`--${string}`, string> = {}
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && !NON_CSS.has(k)) cssVars[roleToVar(k)] = v
  }
  return {
    cssVars,
    sygnet: merged.sygnet as SygnetName | undefined,
    logoVariant: merged.logoVariant as LogoVariant | undefined,
  }
}

// Podpisy swatchy kolorystyki w UI. `default` bywa „Granat" albo (Rekrutacja)
// pierwszym elementem jest `limonka`.
export const SCHEME_LABELS = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  zloto: 'Złoto',
  jasny: 'Jasny',
  szary: 'Szary',
}
