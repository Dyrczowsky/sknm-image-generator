# Dodawanie nowego szablonu (layoutu plakatu)

Przykład: dodajemy layout `piknik` ("Piknik").

Nazewnictwo: `poster_key` to krótki, mały wyraz bez spacji (`piknik`), używany
w rejestrze, w `schemes.ts`, w bazie i w URL-u podglądu. Komponenty to
`PosterPiknik` / `FormPiknik`.

## 1. Komponent plakatu — `src/posters/PosterPiknik.tsx`

Plakat dostaje `PosterProps` (`{ data, scheme, accent, lang }`), uzupełnia dane placeholderami
i rozwiązuje schemat kolorów. Kontener to zawsze `PosterFrame` (1080×1080).

```tsx
import type { PosterProps } from '../types'
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { FooterLogos } from './blocks/FooterLogos'
import { PosterFrame } from './blocks/PosterFrame'
import { Sygnet } from './blocks/Sygnet'

export function PosterPiknik({ data, scheme, accent, lang = 'pl' }: PosterProps) {
  const { title, subtitle, event_date, location, logoSlots, qrUrl } = withPlaceholders(data)
  const { cssVars, sygnet, logoVariant } = resolveScheme('piknik', scheme, accent)

  return (
    <PosterFrame vars={cssVars} padding={72}>
      <Sygnet name={sygnet} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 32, color: 'var(--accent)' }}>{subtitle}</div>}
        <div style={{ fontSize: 28 }}>{event_date} · {location}</div>
      </div>

      {/* Stopka: logo PK w prawym dolnym rogu (ta sama pozycja we wszystkich
          szablonach), kod QR odbity maksymalnie w lewo. `logoSlots` to logo PK
          (o ile włączone) i grafiki wgrane w formularzu. */}
      <FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />
    </PosterFrame>
  )
}
```

Reguły:

- **Style tylko inline + `var(--rola)`** — patrz [stylowanie.md](./stylowanie.md). Nie Tailwind.
- Każdy kolor sterowany schematem to rola CSS (`var(--page-bg)`, `var(--accent)`, ...).
  Kolor stały we wszystkich wariantach może zostać literałem w JSX (jak np. koralowa
  etykieta miesiąca w layoucie `data`).
- Powtarzalne fragmenty (sygnet, plakietka, stopka z logo, linia info, wielka liczba
  dnia, trójkąty, kliny) bierz z `src/posters/blocks/` zamiast pisać od zera.
- Wbudowany tekst w dwóch językach (domyślna plakietka, linie brandingu, adres
  strony) trzymaj w `src/posters/copy.ts` i wybieraj przez `[lang]`, np.
  `{badge || DEFAULT_BADGE.piknik[lang]}`.
- Wymiary i typografię trzymaj w skali z `src/posters/theme.ts`, gdzie pasuje.
- **Widoczność pól:** dołóż `fx` (i `hidden`) z `withPlaceholders(data)` i rozlej
  `...fx('<pole>')` na element każdego pola tekstowego, np.
  `<div style={{ fontSize: 96, ...fx('title') }}>{title}</div>`. Pola przekazywane
  do `InfoLine` podajesz jako `{ text, hidden: hidden('<pole>') }`. Ukryte pole
  dostaje `display: none` i wypada z układu - plakat sam się przekłada. Jeśli pole
  siedzi w osobnym kontenerze z tłem/ramką (np. pływające pudełko z datą), owiń
  ten kontener warunkiem `{!hidden('<pole>') && ...}`, żeby nie zostało puste
  pudełko.

## 2. Formularz — `src/forms/FormPiknik.tsx`

Formularz layoutu to lista pól podana wspólnemu szkieletowi `PosterForm`, który
sam dokłada suwaki rozmiaru, grafiki stopki z kodem QR i (opcjonalnie) galerię
zdjęć.

```tsx
import type { FormProps } from '../types'
import { FIELDS } from './fields'
import type { FieldSpec } from './fields'
import { PosterForm } from './PosterForm'

const PIKNIK_FIELDS: FieldSpec[] = [
  FIELDS.title,
  { name: 'subtitle', label: 'Podtytuł' },
  FIELDS.date,
  FIELDS.location,
]

export function FormPiknik(props: FormProps) {
  return <PosterForm {...props} fields={PIKNIK_FIELDS} />
}
```

Z czego się składa:

- `FieldSpec` (`fields.ts`) — opis pola: `name` (klucz w `FormValues`), `label`,
  `type` (`text` domyślnie / `date` / `time` / `textarea` dla dłuższego akapitu,
  patrz `FormKomunikat.tsx`) i opcjonalny `placeholder`. Bez `placeholder` pole
  pokazuje wartość przykładową z `PLACEHOLDERS` (`posters/fallback.ts`). Każde
  pole ma checkbox widoczności.
- `FIELDS` — gotowe pola o typowych podpisach (tytuł, podtytuł, prelegent, data,
  godzina, lokalizacja); `badgeField(placeholder)` — pole plakietki, którego
  placeholder to domyślna treść z `DEFAULT_BADGE` w `posters/copy.ts`.
- `photoLabel="..."` na `PosterForm` — dokłada galerię 0..4 zdjęć z kadrowaniem
  (`value.photos.photo`); po stronie plakatu `<PhotoGallery photos={photos.photo} />`.
- `children` `PosterForm` — sekcje własne layoutu między polami a grafikami, np.
  lista powtarzalna (program konferencji w `FormKonferencja.tsx`, `value.lists`).

Formularz nie zmienia stanu sam: woła `onChange(przekształcenie)`, gdzie
przekształcenia (`setField`, `addGraphics`, `addListItem`, ...) to czyste
funkcje z `src/editor/formState.ts`. Nowy rodzaj zmiany = nowa funkcja tam
(+ test w `formState.test.ts`).

Suwaki rozmiaru (70%-130%, `value.titleScale` / `value.textScale`, spinacz
`value.scaleLinked`) są w każdym formularzu. W komponencie plakatu pomnóż
`fontSize` tytułu przez `titleScale` (`fontSize: 96 * titleScale`), a
podtytułu/treści przez `textScale` — jeśli podtytuł jedzie przez `InfoLine`,
użyj `partsStyle`/`secondLineStyle` zamiast przestylowywać cały wiersz (patrz
`PosterWyklad.tsx`/`PosterData.tsx`). Suwaki, grafiki, zdjęcia i listy są
sesyjne — do draftu trafiają tylko pola tekstowe i ich widoczność.

Stan formularza jest globalny — nie każdy layout musi używać wszystkich pól.

## 3. Schemat kolorów — `src/posters/schemes.ts`

Każdy layout musi mieć **pełny blok bazowy** (`default`, a gdy go nie ma -
pierwszy schemat) ze wszystkimi rolami, których używa jego komponent (rola
nieobecna spada do `:root` w `index.css` — patrz `⚠️` w
[stylowanie.md](./stylowanie.md)).

```ts
const piknik: LayoutSchemes = {
  default: {
    pageBg: colors.lime, pageText: colors.limeText, accent: colors.navy,
    sygnet: 'granat', logoVariant: 'dark',
  },
  // kolejne warianty nadpisują tylko różnice; kolejność kluczy = kolejność
  // swatchy na pasku kolorystyki:
  czern: { pageBg: colors.black, pageText: colors.cream, accent: colors.lime,
           sygnet: 'negatywny', logoVariant: 'dark' },
}
```

Kolor `colors.gold` w schemacie łączymy **wyłącznie** z sygnetem `'zloty'`,
a `colors.silver` z `'srebrny'` (schematy „okazjonalny złoty" / „okazjonalny
srebrny"). W innych wariantach akcent to `lime` / `coral` / `navy`.

Nowy layout może dodać wpis w `accentRecipes` (mapa `(accent, ctx) => nadpisania
ról akcentowych`) albo zostawić go `undefined` — wtedy kontrolka akcentu jest dla
tego layoutu wyłączona (jak `data`).

Zarejestruj blok:

```ts
export const schemes: Record<string, LayoutSchemes> = {
  ogloszenie, gala, gosc, data, wyklad, konferencja, rekrutacja, warsztat, komunikat, piknik,
}
```

To wszystko — pasek kolorystyki w generatorze budowany jest wprost z tego bloku
(`schemesFor(poster_key)`), `registry.ts` nie trzyma listy schematów. Layout
z jednym schematem nie pokazuje paska.

Jeśli używasz nazwy wariantu spoza `default / limonka / czern / jasny / szary`
(layout `data` ma dodatkowo `okazjonalnyZloty` / `okazjonalnySrebrny`), dopisz
jej podpis do `SCHEME_LABELS` na dole `schemes.ts` (bez wpisu swatch pokaże
surowy klucz).

Więcej o rolach, `resolveScheme` i konwencji `camelCase → --kebab`:
[dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).

## 4. Baner — `src/posters/banners/BannerPiknik.tsx`

Każdy layout ma też szeroką wersję do zakładki „Baner" (okładka strony
1640×624 i okładka wydarzenia 1920×1005 na Facebooku). To osobny komponent z
tymi samymi propsami (`PosterProps`), tym samym kluczem w `resolveScheme` i tymi
samymi blokami, ale to **wizytówka koła, nie plakat**: zachowuje charakter
layoutu (kliny, zygzak, zdjęcie...), a zamiast tytułu, prelegenta i daty pokazuje
stałą nazwę koła `CLUB_NAME[lang]` (`posters/copy.ts`). Najprościej skopiować
najbliższy istniejący baner (np. `BannerOgloszenie.tsx`).

Reguły:

- Wysokość układu to zawsze 624 px, szerokość 1192-1640 px - projektuj raz,
  płynnie na szerokość; nie rozgałęziaj po kształcie.
- Marginesy bierz z `useBannerLayout()` (`padX`, `padY`) i podaj je w
  `PosterFrame` przez `style={{ padding: ... }}`. Tekst, logo i QR muszą zostać
  w środkowej kolumnie (między `padX` z lewej i z prawej); poza nią może wyjść
  tylko dekoracja i zdjęcia - Facebook przycina boki okładki na telefonie.
- Stopka: `<BannerLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />`
  z `banners/common.tsx` (mniejszy QR, ten sam układ co `FooterLogos` w plakacie).
  Sygnet: `<Sygnet name={sygnet} width={BANNER_SYGNET_W} />`.
- Z `withPlaceholders(data)` bierz tylko `logoSlots`, `qrUrl`, `photos` oraz
  suwaki: nazwę koła mnóż przez `titleScale`, resztę tekstu przez
  `textScale`.
- Jeśli baner ma miejsce na zdjęcie, ustaw w rejestrze `bannerPhoto: true` -
  wspólny formularz banera (`FormBanner`) pokaże wtedy galerię zdjęć.

## 5. Rejestr — `src/posters/registry.ts`

```ts
import { PosterPiknik } from './PosterPiknik'
import { BannerPiknik } from './banners/BannerPiknik'
import { FormPiknik } from '../forms/FormPiknik'

export const posterRegistry: Record<string, RegistryEntry> = {
  // ...
  piknik: { name: 'Piknik', Component: PosterPiknik, Banner: BannerPiknik, Form: FormPiknik },
}
```

`name` to podpis kafelki w TemplateSelector.

## 6. Domyślny szablon w bazie — `src/db/schema.ts`

```ts
export const DEFAULT_TEMPLATES = [
  // ...
  { name: 'Piknik', poster_key: 'piknik' },
]
```

`syncTemplates()` dogrywa brakujące wpisy po `poster_key` przy każdym starcie,
także do baz zapisanych wcześniej w IndexedDB — **nie trzeba** podbijać
`SCHEMA_VERSION` (to tylko przy zmianie kształtu tabel).

## 7. Sprawdzenie

```bash
npm run build      # typecheck + build
npm test
```

Podgląd z danymi przykładowymi (dev):
`http://localhost:5173/sknm-image-generator/poster/piknik`
oraz `.../poster/piknik/czern`.

Potem uruchom `npm run dev`, wybierz "Piknik" w generatorze i zweryfikuj podgląd
na żywo oraz eksport PNG ("Pobierz PNG").

Szablon musi wyglądać dobrze w **trzech kształtach**. Otwórz
`/poster/<klucz>?shape=portrait` i `/poster/<klucz>?shape=landscape`
(bez parametru — kwadrat). Elementy o stałych wymiarach w px (kliny,
zdjęcia, pasy) skaluj przez `usePosterShape()` z `src/posters/shape.ts`
(`kx`/`ky` = ile razy ramka jest szersza/wyższa od kwadratu) — nie
wpisuj `1080` na sztywno i nie rozgałęziaj po formacie papieru. W kreatorze
sprawdź też eksport A4 w pionie i poziomie (PNG i PDF).

Baner obejrzyj pod `/poster/<klucz>?shape=cover` i `?shape=event`, a w
kreatorze w zakładce „Baner" (oba formaty Facebooka, długi tytuł, kod QR).
