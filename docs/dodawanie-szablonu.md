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
import { LogoSlot } from './LogoSlot'
import { sygnetByName } from './logos'
import type { PosterProps } from '../types'

export function PosterPiknik({ data, scheme }: PosterProps) {
  const { title, subtitle, event_date, location, logos } = withPlaceholders(data)
  const s = resolveScheme('piknik', scheme)

  return (
    <PosterFrame vars={s.cssVars} padding={96}>
      <img src={sygnetByName[s.sygnet ?? 'negatywny']} alt="SKNM" style={{ width: 132 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 32, color: 'var(--accent)' }}>{subtitle}</div>}
        <div style={{ fontSize: 28 }}>{event_date} · {location}</div>
      </div>

      <LogoRow>
        <LogoSlot logo={logos.pk} variant={s.logoVariant} width={190} height={72} />
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

## 2. Formularz — `src/forms/FormPiknik.tsx`

Formularz dostaje `FormProps` i decyduje, które pola pokazać. Kontener:
`className="flex flex-col gap-3.5"`.

```tsx
import type { FormProps } from '../types'
import { PLACEHOLDERS } from '../posters/fallback'
import { FormField } from './FormField'
import { LogoField } from './LogoField'

export function FormPiknik({ value, onFieldChange, onLogoChange, onLogoEnabledChange }: FormProps) {
  return (
    <form className="flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
      <FormField type="text" label="Tytuł" placeholder={PLACEHOLDERS.title}
        value={value.title} onChange={(v) => onFieldChange('title', v)} />
      <FormField type="text" label="Podtytuł"
        value={value.subtitle} onChange={(v) => onFieldChange('subtitle', v)} />
      <FormField type="date" label="Data"
        value={value.event_date} onChange={(v) => onFieldChange('event_date', v)} />
      <FormField type="text" label="Lokalizacja" placeholder={PLACEHOLDERS.location}
        value={value.location} onChange={(v) => onFieldChange('location', v)} />

      <LogoField fieldKey="pk" label="Logo PK" value={value}
        onChange={onLogoChange} onEnabledChange={onLogoEnabledChange} />
    </form>
  )
}
```

Dostępne klocki:

- `FormField` — pojedyncze `<label><input>` (`type` = `text` / `date` / `time`)
- `LogoField` — slot logo (checkbox włącz/wyłącz + upload), klucz w `value.logos`
- `PhotoGalleryField` — galeria 0..N zdjęć z kadrowaniem, klucz w `value.photos`
- lista powtarzalna (jak program konferencji) — patrz `FormKonferencja.tsx`,
  używa `onListItemAdd` / `onListItemChange` / `onListItemRemove` i `value.lists`

Stan formularza jest globalny — nie każdy layout musi używać wszystkich pól.

## 3. Schemat kolorów — `src/posters/schemes.ts`

Każdy layout musi mieć **pełny blok `default`** ze wszystkimi rolami, których
używa jego komponent (rola nieobecna spada do `:root` w `index.css` — patrz
`⚠️` w [stylowanie.md](./stylowanie.md)).

```ts
const piknik: LayoutSchemes = {
  default: {
    pageBg: colors.lime, pageText: colors.limeText, accent: colors.navy,
    sygnet: 'granat', logoVariant: 'dark',
  },
  // kolejne warianty nadpisują tylko różnice względem default:
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

Jeśli używasz nazwy wariantu spoza `default/limonka/czern/zloto/jasny/szary`,
dopisz jej podpis do `SCHEME_LABELS` na dole `schemes.ts`.

Więcej o rolach, `resolveScheme` i konwencji `camelCase → --kebab`:
[dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).

## 4. Rejestr — `src/posters/registry.ts`

```ts
import { PosterPiknik } from './PosterPiknik'
import { FormPiknik } from '../forms/FormPiknik'

export const posterRegistry: Record<string, RegistryEntry> = {
  // ...
  piknik: {
    name: 'Piknik',                       // podpis kafelki w TemplateSelector
    Component: PosterPiknik,
    Form: FormPiknik,
    schemes: ['default', 'czern'],        // pierwszy = domyślny; pomiń pole dla 1 wariantu
  },
}
```

`schemes` to uporządkowana lista nazw z bloku w `schemes.ts`. Layout bez `schemes`
(jak Gala) nie pokazuje paska kolorystyki i zawsze rysuje `default`.

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
