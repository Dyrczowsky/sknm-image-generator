import { colors } from './theme'
import type { AccentName, LogoVariant, ResolvedScheme, SygnetName } from '../types'

// Wszystkie role kolorów, jakich używają plakaty. Każda staje się zmienną CSS
// `--kebab-case` (patrz `roleToVar`). Nowa rola = dopisz tutaj; wtedy TypeScript
// wyłapie literówkę w bloku schematu (`qrBrdr` zamiast `qrBorder`).
export type Role =
  | 'pageBg' | 'pageText' | 'mutedText' | 'accent' | 'title'
  | 'gold' | 'panel' | 'panelText' | 'panelBr' | 'sygnetBg'
  | 'badgeFill' | 'badgeText' | 'badgeColor' | 'headerBadge' | 'footerBadge'
  | 'speaker' | 'chips' | 'washTop' | 'wedgeBr' | 'wedgeBl'
  | 'lineFirst' | 'lineRest'
  | 'band' | 'subColor' | 'footerText'
  | 'pillFill' | 'pillText' | 'slotBg' | 'qr' | 'qrBorder' | 'qrText'
  | 'tri1' | 'tri2' | 'tri3' | 'monthColor'
  | 'dateBg' | 'dateText'

// Blok jednego schematu: podzbiór ról + opcjonalny sygnet/logoVariant + (dla
// schematów parametryzowanych osią akcentu) `accents` / `defaultAccent`.
interface SchemeBlock extends Partial<Record<Role, string>> {
  sygnet?: SygnetName
  logoVariant?: LogoVariant
  // Obecność `accents` = schemat MA oś akcentu (kontrolka aktywna). Brak =
  // schemat stały (kontrolka wyłączona dla tego schematu). `'all'` = wszystkie 5.
  accents?: AccentName[] | 'all'
  // Akcent renderowany, gdy użytkownik nic nie wybrał („Domyślny" w kontrolce).
  defaultAccent?: AccentName
}
type LayoutSchemes = Record<string, SchemeBlock>

// Schematy kolorów są ZAGNIEŻDŻONE per layout, bo „granat" Wykładu (biały na
// granacie) to nie to samo co „granat" Warsztatu (granat na kremie). Każdy
// layout ma blok bazowy (`default`, a gdy go brak — pierwszy schemat, jak w
// Rekrutacji) + nazwane schematy nadpisujące tylko różnice.
// Bloki layoutów są poniżej, jeden na layout.
// UWAGA: rola nieobecna w `default` danego layoutu nie renderuje pustki —
// `var(--<rola>)` spada do wartości z `:root` w src/index.css (np. `--accent`
// koliduje z firmowym niebieskim aplikacji), więc każda rola używana przez
// plakat musi istnieć w jego bloku `default`.

const ogloszenie: LayoutSchemes = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark',
             accents: ['zolty', 'pomaranczowy', 'granatowy'], defaultAccent: 'zolty' },
  czern: { pageBg: colors.black, accent: colors.lime, sygnet: 'negatywny',
           accents: 'all', defaultAccent: 'zolty' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
  // Okazjonalny — paleta Gali (ink + złoto/srebro), do rzadszych, bardziej
  // uroczystych okazji. Oś ograniczona do metalu; `accent`/`sygnet` liczy recepta.
  okazjonalny: { pageBg: colors.ink, pageText: colors.goldPanelText, logoVariant: 'dark',
                 accents: ['zloty', 'srebrny'], defaultAccent: 'zloty' },
}

// Komunikat rozszerzony — tło z klinami jak Wykład (`washTop`/`wedgeBr`/
// `wedgeBl`, te same wartości na wspólnych schematach) + akapit treści w
// `mutedText`. Jedna rola `accent` niesie naraz wypełnienie plakietki, stos
// trójkątów i podpis; `badgeText` to tekst na plakietce. Oś akcentu jak w
// Wykładzie (bez `granatowy` na granatowym `default`). `szary` zostaje stały
// (bez osi) — jego kliny to ton ciemniejszy od papieru.
const komunikat: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    accent: colors.lime, badgeText: colors.limeText,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
    accents: ['zolty', 'pomaranczowy'], defaultAccent: 'zolty',
  },
  czern: { pageBg: colors.black, accent: colors.lime, badgeText: colors.limeText,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny', accents: 'all', defaultAccent: 'zolty' },
  szary: { pageBg: colors.paper, pageText: colors.slate, mutedText: colors.textMuted,
           accent: colors.grayDark, badgeText: colors.cream,
           washTop: 'rgba(0,0,0,.04)', wedgeBr: colors.creamMuted, wedgeBl: colors.placeholderBg,
           sygnet: 'szary', logoVariant: 'light' },
  // Okazjonalny — paleta Gali (ink + złoto/srebro). `accent`/`badgeText`/
  // `sygnet` liczy recepta.
  okazjonalny: { pageBg: colors.ink, pageText: colors.goldPanelText,
                 washTop: 'rgba(255,255,255,.04)', wedgeBr: colors.inkPanel, wedgeBl: '#0E0F1E',
                 accents: ['zloty', 'srebrny'], defaultAccent: 'zloty' },
}

// Gala — jeden schemat `default` (ink + złoto). Recepta `gala` mapuje akcent
// na rolę `gold` (i przełącza sygnet). Brak swatcha — tylko oś akcentu.
const gala: LayoutSchemes = {
  default: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    sygnet: 'zloty', logoVariant: 'dark',
    accents: 'all', defaultAccent: 'zloty',
  },
}

// Gość — `accent` niesie kolor tekstu Badge i linku „Wstęp wolny". Tło
// narożnego trójkąta bierze `sygnetBg` z fallbackiem do `accent`
// (`var(--sygnet-bg, var(--accent))` w komponencie) — recepta akcentu dla
// metalu (zloty/srebrny) ustawia je jawnie na granat, żeby złoty/srebrny
// sygnet nie zniknął na złotym/srebrnym akcencie. Pudełko z datą niesie
// `dateBg`/`dateText` — dla schematów z osią akcentu liczy je recepta (razem
// z `accent`), dla `szary` (bez osi) zostaje literałem w bloku. Brak schematu
// `jasny` (usunięty).
const gosc: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light',
             accents: ['zolty', 'pomaranczowy', 'granatowy'], defaultAccent: 'granatowy' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           accent: colors.lime, sygnet: 'negatywny', logoVariant: 'dark',
           accents: 'all', defaultAccent: 'zolty' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           dateBg: colors.grayDark, dateText: colors.cream },
  // Okazjonalny — paleta Gali (ink + złoto/srebro). `accent`/`dateBg`/`dateText`
  // i `sygnetBg` (metal) liczy recepta.
  okazjonalny: { pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
                 logoVariant: 'dark', accents: ['zloty', 'srebrny'], defaultAccent: 'zloty' },
}

// Data — liczba jako grafika. Etykieta miesiąca to rola `monthColor` (koral
// domyślnie; złoto/srebro w wariantach okazjonalnych). Trzy dekoracyjne
// trójkąty na dole to role `tri1`/`tri2`/`tri3` — w wariantach okazjonalnych
// wszystkie trzy niosą metal (jednolita, uroczysta paleta), gdzie indziej mają
// osobne kolory. Data zachowuje osobne schematy złoto/srebro (`okazjonalny*`)
// i NIE ma osi akcentu (`accentRecipes.data = undefined`, `accentsFor('data')
// → []`). Brak schematu `jasny` (usunięty).
const data: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.navy, mutedText: colors.textMuted,
             title: colors.ink, tri1: colors.navy, tri2: colors.lime, tri3: colors.coral,
             monthColor: colors.coral,
             sygnet: 'granat', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.lime, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'negatywny', logoVariant: 'dark' },
  okazjonalnyZloty: { pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.gold, tri3: colors.gold,
           monthColor: colors.gold,
           sygnet: 'zloty', logoVariant: 'dark' },
  okazjonalnySrebrny: { pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.silver, tri2: colors.silver, tri3: colors.silver,
           monthColor: colors.silver,
           sygnet: 'srebrny', logoVariant: 'dark' },
  szary: { pageBg: colors.paper, pageText: colors.slate, title: colors.slate,
           tri1: colors.grayDark, tri2: colors.gray, sygnet: 'szary' },
}

// Wykład — typografia. `badgeFill`/`badgeText` to wypełniona plakietka,
// `speaker` kolor nazwiska prelegenta, `chips` stos trzech trójkątów w lewym
// dolnym rogu. Dekoracyjne kliny (`washTop`, `wedgeBr`, `wedgeBl`) mają jawne
// hex/rgba per schemat — bez color-mix. `wedgeBr` niesie tylko kolor; jego
// `opacity: 0.42` zostaje w JSX. Jeden schemat `czern` (żółty akcent wbudowany);
// pozostałe warianty akcentu (coral/złoto/srebro) daje oś akcentu. Brak
// schematów `jasny`/`szary` (usunięte) i brak `granatowy` w osi `default`
// (patrz komentarz przy `accents` niżej).
const wyklad: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
    // Bez `granatowy` — tło strony jest już granatem, więc granatowy akcent
    // (navyLight) traci kontrast na plakietce/nazwisku.
    accents: ['zolty', 'pomaranczowy'], defaultAccent: 'zolty',
  },
  czern: { pageBg: colors.black, badgeFill: colors.lime, badgeText: colors.limeText,
           speaker: colors.lime, chips: colors.lime,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny', accents: 'all', defaultAccent: 'zolty' },
  // Okazjonalny — paleta Gali (ink + złoto/srebro). `badgeFill`/`badgeText`/
  // `speaker`/`chips`/`sygnet` liczy recepta.
  okazjonalny: { pageBg: colors.ink, pageText: colors.goldPanelText,
                 washTop: 'rgba(255,255,255,.04)', wedgeBr: colors.inkPanel, wedgeBl: '#0E0F1E',
                 accents: ['zloty', 'srebrny'], defaultAccent: 'zloty' },
}

// Konferencja — nagłówkowa banda + lista programu. `panel`/`panelText` to pas
// nagłówka (tło/tekst), `headerBadge` plakietka w nagłówku, `footerBadge`
// plakietka w stopce. `lineFirst` to `borderTop` pierwszego wiersza programu,
// `lineRest` wszystkie pozostałe + końcowa kreska — w wariantach na ciemnym
// tle to jawna rgba, nie token. Etykiety godzin w programie są koralowe we
// wszystkich wariantach, więc zostają literałem w komponencie (nie rolą). Jeden
// schemat `czern` (żółty akcent wbudowany); pozostałe akcenty daje oś akcentu.
const konferencja: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
    accents: ['zolty', 'pomaranczowy', 'granatowy'], defaultAccent: 'zolty',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.lime,
    lineFirst: colors.lime, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.lime,
    sygnet: 'negatywny', logoVariant: 'dark',
    accents: 'all', defaultAccent: 'zolty',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    panel: colors.grayDark, headerBadge: colors.cream,
    lineFirst: colors.grayDark, footerBadge: colors.grayDark,
    sygnet: 'szary',
  },
  // Okazjonalny — paleta Gali (ink + złoto/srebro). Tło strony jest ciemne
  // (`colors.ink` jest w `DARK_BGS`), więc recepta liczy `headerBadge`/
  // `lineFirst`/`footerBadge` z akcentu tak jak dla `czern`.
  okazjonalny: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    panel: colors.inkPanel, lineRest: 'rgba(244,242,237,.2)', logoVariant: 'dark',
    accents: ['zloty', 'srebrny'], defaultAccent: 'zloty',
  },
}

// Rekrutacja — wzór z sygnetu. DOMYŚLNY schemat to `limonka` (limonkowa strona),
// nie `default`. `band` to tło dolnej bandy-zygzaka, `subColor` kolor podtytułu
// (gra też rolę mutedText — Rekrutacja NIE ma osobnej roli `mutedText`),
// `footerText` kolor wrappera dolnego bloku info, `badgeColor` tekst plakietki
// `Badge`, `qrBorder`/`qrText` obwódka/etykieta pudełka QR. Długi `clipPath`
// bandy jest identyczny we wszystkich wariantach — rolą jest tylko `background`.
// Rekrutacja nie ma bloku `default`: resolver scala nazwany schemat nad
// pierwszym schematem `limonka`, więc bez tej bazy `czern`/`szary` nie
// odziedziczyłyby wspólnych ról (`footerText`, `qrBorder`, `qrText`,
// `logoVariant`). Jeden schemat `czern` (żółty akcent wbudowany); pozostałe
// warianty akcentu (coral/granat/złoto/srebro) daje oś akcentu — recepta
// `rekrutacja` przelicza też `footerText`/`badgeColor`/`qr*`/`logoVariant`.
// Brak schematu `jasny` (usunięty).
const rekrutacja: LayoutSchemes = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    qr: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
    accents: ['zolty', 'pomaranczowy', 'granatowy'], defaultAccent: 'granatowy',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.lime, subColor: colors.creamMuted, footerText: colors.limeText,
    qr: colors.limeText,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
    accents: 'all', defaultAccent: 'zolty',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    band: colors.grayDark, subColor: colors.textMuted, badgeColor: colors.cream,
    sygnet: 'szary',
  },
}

// Warsztat — najbogatszy zestaw ról. Lokalny komponent `Pill` bierze
// `pillFill`/`pillText`, wypełniona plakietka `badgeFill`/`badgeText`, wielki
// tytuł `title`. `slotBg` obsługuje naraz tło pudełka QR i podkładki obu logo.
// `qrBorder`/`qrText` to obwódka/etykieta pudełka QR — w `default`/`szary`
// równe własnym domyślnym `PlaceholderBox` (placeholderBorder/Text), w
// wariantach na ciemnym tle jawna rgba. Jeden schemat `czern` (żółty akcent
// wbudowany); pozostałe akcenty daje oś akcentu. `badgeFill`/`badgeText`
// niosą akcent tak samo jak `pillFill`/`pillText` (tekst plakietki dobierany
// pod jej własne tło, nie pod tło strony) — na wszystkich schematach z osią.
// Brak schematu `jasny` (usunięty).
const warsztat: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.lime, badgeText: colors.limeText,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
    accents: ['zolty', 'pomaranczowy', 'granatowy'], defaultAccent: 'zolty',
  },
  czern: {
    pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.lime, badgeText: colors.limeText,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.black,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'negatywny', logoVariant: 'dark',
    accents: 'all', defaultAccent: 'zolty',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    title: colors.slate, badgeFill: colors.grayDark, badgeText: colors.cream,
    pillFill: colors.gray, pillText: colors.slate, slotBg: colors.paper,
    sygnet: 'szary',
  },
  // Okazjonalny — paleta Gali (ink + złoto/srebro). `badgeFill`/`badgeText`/
  // `pillFill`/`pillText`/`sygnet` liczy recepta.
  okazjonalny: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    title: colors.cream, slotBg: colors.ink,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    logoVariant: 'dark', accents: ['zloty', 'srebrny'], defaultAccent: 'zloty',
  },
}

// --- Oś akcentu ---
// Recepta zwraca nadpisania ról „akcentowych" danego layoutu dla wybranego
// koloru akcentu. `ctx` = blok już scalony (baza + nazwany schemat) — żeby
// „granatowy" mógł zależeć od tła. Metal (zloty/srebrny) dokłada `sygnet`.
// UWAGA: schemat może dostać oś (`accents`/`defaultAccent`) tylko wtedy, gdy
// `recipe(defaultAccent, blok)` daje dokładnie to, co blok już ma wpisane —
// inaczej „Domyślny" zmieni wygląd schematu. `konferencja`/`warsztat` (role
// akcentowe niejednolite między jasnym `default` i ciemnym `czern`) rozwiązują
// to recepturą zależną od jasności tła strony (`DARK_BGS`) — patrz komentarze
// przy tych recepturach.
type AccentRecipe = (accent: AccentName, ctx: SchemeBlock) => SchemeBlock

const DARK_BGS = new Set<string>([colors.black, colors.ink, colors.navy, colors.inkPanel, colors.navyDark, colors.grayDark])

const isDarkBg = (color: string | undefined): boolean => DARK_BGS.has(color ?? '')

function accentColor(accent: AccentName, ctx: SchemeBlock): string {
  switch (accent) {
    case 'zolty': return colors.lime
    case 'pomaranczowy': return colors.coral
    case 'granatowy': return isDarkBg(ctx.pageBg) ? colors.navyLight : colors.navy
    case 'zloty': return colors.gold
    case 'srebrny': return colors.silver
  }
}

// Tekst na wypełnieniu w kolorze akcentu (plakietka, pigułka, pudełko daty).
// Nie-metale mają stałą parę, srebro zawsze ciemny tekst; tekst na złocie
// dobiera layout (`onGold`).
function textOnAccent(accent: AccentName, onGold: string): string {
  switch (accent) {
    case 'zolty': return colors.limeText
    case 'zloty': return onGold
    case 'srebrny': return colors.ink
    default: return colors.cream
  }
}

const isMetal = (accent: AccentName): accent is 'zloty' | 'srebrny' => accent === 'zloty' || accent === 'srebrny'

// Metaliczny akcent przełącza też sygnet na swój wariant.
function accentSygnet(accent: AccentName): Partial<SchemeBlock> {
  return isMetal(accent) ? { sygnet: accent } : {}
}

const accentRecipes: Record<string, AccentRecipe | undefined> = {
  ogloszenie: (accent, ctx) => ({ accent: accentColor(accent, ctx), ...accentSygnet(accent) }),

  // Metal dostaje granatowe tło trójkąta z sygnetem (`sygnetBg`), żeby złoty/
  // srebrny sygnet nie zniknął na złotym/srebrnym akcencie.
  gosc: (accent, ctx) => {
    const fill = accentColor(accent, ctx)
    return {
      accent: fill,
      dateBg: fill,
      dateText: textOnAccent(accent, colors.ink),
      ...accentSygnet(accent),
      ...(isMetal(accent) && { sygnetBg: colors.navy }),
    }
  },

  wyklad: (accent, ctx) => {
    const fill = accentColor(accent, ctx)
    return { badgeFill: fill, badgeText: textOnAccent(accent, colors.cream), speaker: fill, chips: fill, ...accentSygnet(accent) }
  },

  // Tekst plakietki dobierany jak w Wykładzie.
  komunikat: (accent, ctx) => ({
    accent: accentColor(accent, ctx),
    badgeText: textOnAccent(accent, colors.cream),
    ...accentSygnet(accent),
  }),

  // `headerBadge` (w panelu, zawsze ciemnym) niesie akcent niezależnie od tła
  // strony. `lineFirst`/`footerBadge` niosą akcent tylko na ciemnym tle strony
  // (jak `czern`) — na jasnym tle (`default`) zostają stałym granatem, bo
  // akcent (żółty/koralowy) jako kreska/kropka na kremie wygląda gorzej niż
  // granat i tak wyglądało to dotychczas w `default`.
  konferencja: (accent, ctx) => {
    const onPanel = accentColor(accent, { ...ctx, pageBg: ctx.panel })
    const onPage = isDarkBg(ctx.pageBg) ? accentColor(accent, ctx) : colors.navy
    return { headerBadge: onPanel, lineFirst: onPage, footerBadge: onPage, ...accentSygnet(accent) }
  },

  // `pillFill`/`pillText` i `badgeFill`/`badgeText` zawsze niosą akcent —
  // tekst dobrany pod własne tło plakietki/pigułki, niezależnie od tła strony.
  warsztat: (accent, ctx) => {
    const fill = accentColor(accent, ctx)
    const text = textOnAccent(accent, colors.ink)
    return { badgeFill: fill, badgeText: text, pillFill: fill, pillText: text, ...accentSygnet(accent) }
  },

  rekrutacja: (accent, ctx) => {
    // `lightBand` = banda na tyle jasna, że kolorowe (domyślne) logo PK i
    // ciemny QR-obrys na niej czytelne. Złoto (`zloty`, brąz-oliwka) jest ZA
    // CIEMNE na to — dostaje traktowanie jak `granatowy` (logo negatywne,
    // jasny QR-obrys), inaczej niż jasne srebro.
    const lightBand = accent === 'zolty' || accent === 'pomaranczowy' || accent === 'srebrny'
    const footerText = isMetal(accent) ? colors.ink : lightBand ? colors.limeText : colors.cream
    return {
      band: accentColor(accent, ctx),
      footerText,
      // QR leży na bandzie, więc ma ten sam kolor co tekst stopki.
      qr: footerText,
      // "wycięcie" plakietki w kolorze tła strony — na jasnym tle (limonka)
      // daje limonkę, na ciemnym (czern) daje czerń, jak dotychczas.
      badgeColor: accent === 'srebrny' ? colors.ink : (ctx.pageBg ?? colors.cream),
      qrBorder: lightBand ? 'rgba(18,18,18,.4)' : 'rgba(244,242,237,.55)',
      qrText: lightBand ? 'rgba(18,18,18,.6)' : 'rgba(244,242,237,.75)',
      logoVariant: lightBand ? 'light' : 'dark',
      ...accentSygnet(accent),
    }
  },

  // Gala zawsze ustawia sygnet: metaliczny dla metalu, negatywny dla reszty.
  gala: (accent, ctx) => ({
    gold: accentColor(accent, ctx),
    sygnet: isMetal(accent) ? accent : 'negatywny',
  }),

  // „Data" nie ma osi akcentu - złoto/srebro to u niej osobne schematy.
  data: undefined,
}

export const ACCENT_NAMES: AccentName[] = ['zolty', 'pomaranczowy', 'granatowy', 'zloty', 'srebrny']

// Czy layout w OGÓLE ma oś akcentu (istnieje recepta). Fałsz → kontrolka
// akcentu w ogóle się nie pokazuje dla tego layoutu (np. „Data").
export function layoutHasAccentAxis(layoutKey: string): boolean {
  return Boolean(accentRecipes[layoutKey])
}

// Deklaracja osi akcentu dla pary (layout, schemat). Czytana z WŁASNEGO bloku
// schematu (nie scalonego z bazą — żeby stały schemat nie dziedziczył osi po
// bazie), a gdy brak nazwy — z bloku bazowego. Zwrócona lista to kopia.
function axisInfo(layoutKey: string, schemeName?: string): { accents: AccentName[]; defaultAccent?: AccentName } {
  if (!layoutHasAccentAxis(layoutKey)) return { accents: [] }
  const layout = schemes[layoutKey] ?? {}
  const block = (schemeName ? layout[schemeName] : undefined) ?? baseBlock(layout)
  if (block.accents === undefined) return { accents: [] }
  return {
    accents: block.accents === 'all' ? [...ACCENT_NAMES] : [...block.accents],
    defaultAccent: block.defaultAccent,
  }
}

// Dostępne akcenty dla pary (layout, schemat). Puste = schemat stały (kontrolka
// nieaktywna) albo layout bez osi (patrz `layoutHasAccentAxis`).
export function accentsFor(layoutKey: string, schemeName?: string): AccentName[] {
  return axisInfo(layoutKey, schemeName).accents
}

// „Domyślny" akcent schematu (renderowany, gdy użytkownik nic nie wybrał).
export function defaultAccentFor(layoutKey: string, schemeName?: string): AccentName | undefined {
  return axisInfo(layoutKey, schemeName).defaultAccent
}

// Czy akcent jest dozwolony dla pary (layout, schemat) — do „przypięcia"
// zapisanego akcentu, gdy zmiana schematu zawęża listę.
export function accentAllowed(layoutKey: string, schemeName: string | undefined, accent: AccentName | undefined): boolean {
  if (!accent) return true
  return accentsFor(layoutKey, schemeName).includes(accent)
}

export const ACCENT_LABELS: Record<AccentName, string> = {
  zolty: 'Żółty',
  pomaranczowy: 'Pomarańczowy',
  granatowy: 'Granatowy',
  zloty: 'Złoty (okazjonalny)',
  srebrny: 'Srebrny (okazjonalny)',
}

// Kolor kropki-podglądu akcentu w kontrolce.
export const ACCENT_DOT: Record<AccentName, string> = {
  zolty: colors.lime,
  pomaranczowy: colors.coral,
  granatowy: colors.navy,
  zloty: colors.gold,
  srebrny: colors.silver,
}

export const schemes: Record<string, LayoutSchemes> = { ogloszenie, gala, gosc, data, wyklad, konferencja, rekrutacja, warsztat, komunikat }

// camelCase → --kebab; layout może dodać dowolną rolę bez zmiany resolvera.
const roleToVar = (role: string): `--${string}` => `--${role.replace(/[A-Z]/g, (upper) => `-${upper.toLowerCase()}`)}`
// Pola bloku schematu, które nie są rolami kolorów (nie stają się zmiennymi CSS).
const NON_CSS = new Set(['sygnet', 'logoVariant', 'accents', 'defaultAccent'])

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

// Scala nazwany schemat nad blokiem bazowym layoutu, a następnie — dla schematu
// z osią akcentu — nadpisania z recepty dla wybranego akcentu (a gdy nic nie
// wybrano, dla `defaultAccent` schematu). Schemat stały (`accents` nieobecne)
// renderuje się jak zapisany w bloku. Nieznany layout/schemat → pusty wynik.
export function resolveScheme(
  layoutKey: string,
  name: string | undefined,
  accent?: AccentName,
): ResolvedScheme {
  const layout = schemes[layoutKey] ?? {}
  const merged: SchemeBlock = { ...baseBlock(layout), ...(name ? layout[name] : undefined) }

  const recipe = accentRecipes[layoutKey]
  const axis = axisInfo(layoutKey, name)
  const effectiveAccent = axis.accents.length ? (accent ?? axis.defaultAccent) : undefined
  const block: SchemeBlock = effectiveAccent && recipe ? { ...merged, ...recipe(effectiveAccent, merged) } : merged

  const cssVars: ResolvedScheme['cssVars'] = {}
  for (const [role, value] of Object.entries(block)) {
    if (value !== undefined && !NON_CSS.has(role)) cssVars[roleToVar(role)] = value as string
  }
  return { cssVars, sygnet: block.sygnet, logoVariant: block.logoVariant }
}

// Podpisy swatchy kolorystyki w UI. Brak wpisu → swatch pokazuje surowy klucz
// schematu, więc każdą nową nazwę dopisz tutaj.
export const SCHEME_LABELS: Record<string, string> = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  jasny: 'Jasny',
  szary: 'Szary',
  // używane wyłącznie przez layout „Data" (ma osobne schematy złoto/srebro,
  // bez osi akcentu):
  okazjonalnyZloty: 'Okazjonalny złoty',
  okazjonalnySrebrny: 'Okazjonalny srebrny',
  // pozostałe layouty: jeden schemat „Okazjonalny" (paleta Gali), złoto/srebro
  // wybierane osią akcentu:
  okazjonalny: 'Okazjonalny',
}
