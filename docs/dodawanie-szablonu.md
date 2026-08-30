# Dodawanie nowego szablonu (layoutu plakatu)

Przykład: dodajemy layout `piknik` ("Piknik").

Nazewnictwo: `poster_key` to krótki, mały wyraz bez spacji (`piknik`), używany
w rejestrze, w `schemes.ts`, w bazie i w URL-u podglądu. Komponenty to
`PosterPiknik` / `FormPiknik`.

## 1. Komponent plakatu — `src/posters/PosterPiknik.tsx`

Plakat dostaje `PosterProps` (`{ data, scheme }`), uzupełnia dane placeholderami
i rozwiązuje schemat kolorów. Kontener to zawsze `PosterFrame` (1080×1080).

```tsx
import { withPlaceholders } from './fallback'
import { resolveScheme } from './schemes'
import { PosterFrame } from './blocks/PosterFrame'
import { LogoRow } from './blocks/LogoRow'
import { LogoSlots } from './blocks/LogoSlots'
import { QrSlot } from './blocks/QrSlot'
import { QR_SLOT_H } from './theme'
import { sygnetByName } from './logos'
import type { PosterProps } from '../types'

export function PosterPiknik({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, location, graphics, showPkLogo, qrUrl, qrColor } = withPlaceholders(data)
  const s = resolveScheme('piknik', scheme)
  // null = domyślne logo PK (fallback), string = hurtowo wgrana grafika
  const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]

  return (
    <PosterFrame vars={s.cssVars} padding={72}>
      <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 32, color: 'var(--accent)' }}>{subtitle}</div>}
        <div style={{ fontSize: 28 }}>{event_date} · {location}</div>
      </div>

      {/* Stopka: logo PK w prawym dolnym rogu (ta sama pozycja we wszystkich
          szablonach), kod QR odbity maksymalnie w lewo. `LogoRow` sam
          wysuwa się o pole ochronne; `minHeight` rezerwuje miejsce na QR. */}
      <LogoRow minHeight={QR_SLOT_H}>
        <QrSlot value={qrUrl} color={qrColor} />
        <LogoSlots slots={slots} variant={s.logoVariant} />
      </LogoRow>
    </PosterFrame>
  )
}
```

Reguły:

- **Style tylko inline + `var(--rola)`** — patrz [stylowanie.md](./stylowanie.md). Nie Tailwind.
- Każdy kolor sterowany schematem to rola CSS (`var(--page-bg)`, `var(--accent)`, ...).
  Kolor stały we wszystkich wariantach może zostać literałem w JSX (jak np. koralowa
  etykieta miesiąca w layoucie `data`).
- Powtarzalne fragmenty (plakietka, rząd logo, linia info, wielka liczba dnia) bierz
  z `src/posters/blocks/` zamiast pisać od zera.
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

Formularz dostaje `FormProps` i decyduje, które pola pokazać. Kontener:
`className="flex flex-col gap-3.5"`.

```tsx
import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { GraphicsField } from './GraphicsField'

export function FormPiknik({ value, onFieldChange, onVisibilityChange, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange }: FormProps) {
  // `name` + `{...vis}` włączają checkbox widoczności przy etykiecie pola.
  const vis = { visibility: value.visibility, onVisibilityChange }
  const gfx = { value, onGraphicsAdd, onGraphicRemove, onGraphicMove, onShowPkChange }
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField name="title" {...vis} type="text" label="Tytuł" placeholder={PLACEHOLDERS.title}
        value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField name="subtitle" {...vis} type="text" label="Podtytuł"
        value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField name="event_date" {...vis} type="date" label="Data"
        value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField name="location" {...vis} type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location}
        value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <GraphicsField {...gfx} />
    </form>
  )
}
```

Dostępne klocki:

- `FormField` — pojedyncze `<label><input>` (`type` = `text` / `date` / `time`)
- `GraphicsField` — checkbox „Dodaj logo PK" + hurtowe wgrywanie grafik stopki
  (miniatury, kolejność strzałkami, usuwanie) + pole „Kod QR" (link). Stan w
  `value.graphics` / `value.showPkLogo` / `value.qrUrl`. Po stronie plakatu:
  `<LogoSlots slots={…} />` dla grafik, `<QrSlot value={qrUrl} color={qrColor} />` dla kodu QR.
  Cała trójka to jeden komplet propsów — patrz `const gfx = {…}` w każdym formularzu.
- `PhotoGalleryField` — galeria 0..N zdjęć z kadrowaniem, klucz w `value.photos`
- lista powtarzalna (jak program konferencji) — patrz `FormKonferencja.tsx`,
  używa `onListItemAdd` / `onListItemChange` / `onListItemRemove` i `value.lists`

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
  czern: { pageBg: colors.black, pageText: colors.cream, accent: colors.gold,
           sygnet: 'negatywny', logoVariant: 'dark' },
}
```

Zarejestruj blok:

```ts
export const schemes: Record<string, LayoutSchemes> = {
  ogloszenie, gala, gosc, data, wyklad, konferencja, rekrutacja, warsztat, piknik,
}
```

To wszystko — pasek kolorystyki w generatorze budowany jest wprost z tego bloku
(`schemesFor(poster_key)`), `registry.ts` nie trzyma listy schematów. Layout
z jednym schematem (jak Gala) nie pokazuje paska.

Jeśli używasz nazwy wariantu spoza `default/limonka/czern/zloto/jasny/szary`,
dopisz jej podpis do `SCHEME_LABELS` na dole `schemes.ts` (bez wpisu swatch
pokaże surowy klucz).

Więcej o rolach, `resolveScheme` i konwencji `camelCase → --kebab`:
[dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).

## 4. Rejestr — `src/posters/registry.ts`

```ts
import { PosterPiknik } from './PosterPiknik'
import { FormPiknik } from '../forms/FormPiknik'

export const posterRegistry: Record<string, RegistryEntry> = {
  // ...
  piknik: { name: 'Piknik', Component: PosterPiknik, Form: FormPiknik },
}
```

`name` to podpis kafelki w TemplateSelector.

## 5. Domyślny szablon w bazie — `src/db/schema.ts`

```ts
export const DEFAULT_TEMPLATES = [
  // ...
  { name: 'Piknik', poster_key: 'piknik' },
]
```

`syncTemplates()` dogrywa brakujące wpisy po `poster_key` przy każdym starcie,
także do baz zapisanych wcześniej w IndexedDB — **nie trzeba** podbijać
`SCHEMA_VERSION` (to tylko przy zmianie kształtu tabel).

## 6. Sprawdzenie

```bash
npm run build      # typecheck + build
npm test
```

Podgląd z danymi przykładowymi (dev):
`http://localhost:5173/sknm-image-generator/poster/piknik`
oraz `.../poster/piknik/czern`.

Potem uruchom `npm run dev`, wybierz "Piknik" w generatorze i zweryfikuj podgląd
na żywo oraz eksport PNG ("Pobierz PNG").
