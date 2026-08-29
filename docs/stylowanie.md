# Stylowanie

Projekt ma **dwa rozłączne światy stylów**. Nie mieszaj ich.

| | UI aplikacji (edytor) | Plakaty (`src/posters/**`) |
|---|---|---|
| Technika | Tailwind CSS v4 (klasy utility w JSX) | style inline (`style={{ ... }}`) + zmienne CSS |
| Gdzie | `App.tsx`, `src/components`, `src/forms`, `src/pages` | `src/posters/**`, `src/posters/blocks/**` |
| Motyw ciemny | `@media (prefers-color-scheme: dark)` w `index.css` | schematy kolorów per layout (`schemes.ts`) |

## UI aplikacji - Tailwind v4

Konfiguracja jest CSS-first, bez `tailwind.config.js`:

- `@tailwindcss/vite` w `vite.config.ts`
- `src/index.css`:
  - `@import 'tailwindcss';`
  - `@theme inline { ... }` mapuje semantyczne tokeny na utilities
  - blok `:root` + `@media (prefers-color-scheme: dark)` trzyma **wartości** tokenów
  - `@layer base` - drobne reguły nie do wyrażenia w utilities (thumb suwaka `.crop-slider`, tło/kolor `body`)

### Tokeny kolorów

Utility (`bg-*`, `text-*`, `border-*`) → zmienna → wartość:

| Utility | `--color-*` | źródło (`:root`) | rola |
|---|---|---|---|
| `bg-bg` | `--color-bg` | `--bg` | tło strony, tło wpisu historii |
| `bg-surface` | `--color-surface` | `--surface` | tło panelu (karty sekcji) |
| `border-border` | `--color-border` | `--surface-border` | obramowania paneli, separatory |
| `text-fg` | `--color-fg` | `--text` | główny tekst |
| `text-muted` | `--color-muted` | `--text-muted` | podpisy, nagłówki sekcji, hinty |
| `bg-field` / `border-field-border` | `--color-field` / `--color-field-border` | `--input-bg` / `--input-border` | pola formularza |
| `bg-accent` / `hover:bg-accent-hover` / `bg-accent-soft` | `--color-accent*` | `--accent*` | firmowy niebieski, akcje |
| `text-danger` / `border-danger` | `--color-danger` | literał `#ef4444` | akcje usuwania |

**Motyw ciemny działa sam** - `@media (prefers-color-scheme: dark)` podmienia wartości
w `:root`, a że `@theme inline` trzyma w utilities `var(--...)`, nie ma potrzeby wariantów
`dark:` w JSX. Jeśli kiedyś potrzebny będzie ręczny przełącznik, dopiero wtedy dochodzi
`dark:`/`data-theme`.

### Zasady

- Nowy element UI stylujesz **klasami Tailwinda w JSX**. Nie twórz plików `.css`.
- Kolory bierz z tokenów powyżej, nie z literałów hex (wyjątek: `danger`, jak w kodzie).
- Dłuższy, powtarzalny zestaw klas wyciągnij do stałej w komponencie
  (np. `const panel = '...'` w `App.tsx`, `actionButton` w `HistoryList.tsx`) -
  nie do `@apply`.
- Wartości spoza skali podawaj arbitralnie: `py-[9px]`, `rounded-[10px]`,
  `min-[900px]:...`, `[grid-area:preview]`.
- Breakpoint układu dwukolumnowego to **900px** (`min-[900px]:`), nie domyślne `lg`.

### `⚠️` Zmienne `:root` są też fallbackiem dla plakatów

`src/posters/schemes.ts` polega na tym, że rola nieprzypisana w schemacie
(`var(--accent)` itp.) spada do `:root` w `index.css`. **Nie zmieniaj nazw
`--accent` / `--bg` / `--text` itd.** bez przejrzenia `schemes.ts`. Bezpieczne jest
dodawanie nowych tokenów; ryzykowne - przemianowanie istniejących.

## Plakaty - style inline + zmienne CSS

Plakaty **celowo nie używają Tailwinda**:

- Eksport do PNG (`html-to-image`, `src/posters/export.ts`) rasteryzuje węzeł DOM;
  style inline + `resolveScheme(...).cssVars` rozlane na `PosterFrame` są tu
  najpewniejsze i nie zależą od tego, co Tailwind wygeneruje.
- Kolory plakatu to **role** (`--page-bg`, `--accent`, `--badge-fill`, ...),
  a nie stany jasny/ciemny - patrz [dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md).
- Wspólne tokeny (kolory, typografia) siedzą w `src/posters/theme.ts`,
  wspólne fragmenty layoutu w `src/posters/blocks/`.

Przy pracy nad plakatem trzymaj się tej konwencji - dodawaj `style={{ ... }}`
i `var(--rola)`, ewentualnie nowy blok w `blocks/`.
