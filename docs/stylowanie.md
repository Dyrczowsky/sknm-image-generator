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
| `text-danger` / `border-danger` | `--color-danger` | `--danger` | tekst i ramka akcji usuwania, treść błędu |
| `bg-sunken` | `--color-sunken` | `--sunken` | poziom „pod" stroną: tło podglądu plakatu, tory przełączników |
| `text-accent-text` | `--color-accent-text` | `--accent-text` | akcent jako **tekst / ikona** (linki, stan zaznaczenia) |
| `text-on-accent` | `--color-on-accent` | literał `#ffffff` | tekst na `bg-accent` i `bg-danger-solid` |
| `bg-danger-solid` / `bg-danger-soft` | `--color-danger-*` | `--danger-solid` / `--danger-soft` | wypełnienie ostatecznego potwierdzenia / tło hovera i pigułki błędu |
| `text-success` / `text-warning` | `--color-success` / `--color-warning` | `--success` / `--warning` | stan zapisu („Zapisano", „Niezapisane zmiany") |
| `outline-focus` | `--color-focus` | `--focus` | pierścień fokusu (ustawiany globalnie, patrz niżej) |
| `shadow-pop` | `--shadow-pop` | `--elevation-pop` | cień panelu wysuwanego (Popover) |

**Motyw ciemny działa sam** - `@media (prefers-color-scheme: dark)` podmienia wartości
w `:root`, a że `@theme inline` trzyma w utilities `var(--...)`, nie ma potrzeby wariantów
`dark:` w JSX. Jeśli kiedyś potrzebny będzie ręczny przełącznik, dopiero wtedy dochodzi
`dark:`/`data-theme`.

### Zasady

- Nowy element UI stylujesz **klasami Tailwinda w JSX**. Nie twórz plików `.css`.
- Kolory bierz z tokenów powyżej, nie z literałów hex.
- Kolor akcentu na tekście to `text-accent-text`, nie `text-accent` - sam `--accent`
  na ciemnym tle ma kontrast 3,6:1. `bg-accent` zostaje dla wypełnień (z `text-on-accent`).
- Dłuższy, powtarzalny zestaw klas wyciągnij do stałej w komponencie
  (np. `PANEL` w `App.tsx`, `actionButton` w `HistoryList.tsx`), a gdy powtarza się
  w kilku plikach - do `src/components/styles.ts` -
  nie do `@apply`.
- Wartości spoza skali podawaj arbitralnie: `py-[9px]`, `rounded-[10px]`,
  `min-[900px]:...`, `[grid-area:preview]`.
- Breakpoint układu dwukolumnowego to **900px** (`min-[900px]:`), nie domyślne `lg`.

### Prymitywy - `src/components/ui`

Przyciski, pola, zakładki i panele bierz z `src/components/ui` (import z `index.ts`),
zamiast składać je z klas na nowo:

| Prymityw | Do czego | Najważniejsze propsy |
|---|---|---|
| `Button` | każda akcja z tekstem | `variant` (`primary` / `outline` / `ghost` / `danger`), `size` (`sm` / `md`), `icon`, `iconEnd`, `busy`, `busyLabel`, `fullWidth`, `align` |
| `IconButton` | akcja z samą ikoną | `icon`, `label` (obowiązkowa nazwa), `variant`, `size`, `busy`, `aria-pressed` |
| `Field` | etykieta + kontrolka + podpowiedź / błąd | `label`, `hint`, `error`, `required`, `action`, `labelHidden` |
| `Input` / `Textarea` / `Select` | kontrolki o jednym wyglądzie | natywne atrybuty + `size` (`sm` / `md`) |
| `Tabs` + `TabList` + `TabPanel` | zakładki; nieaktywny panel zostaje w drzewie (`hidden`) | `value`, `onChange`; `label`, `tabs`, `fill` |
| `Popover` | panel przypięty do przycisku (menu, pomoc) | `trigger`, `label`, `align`, `side`, `role`, `open` / `onOpenChange` |
| `ConfirmButton` | akcja niszcząca z pytaniem w miejscu przycisku (zamiast `window.confirm`) | `question`, `confirmLabel`, `onConfirm` |
| `Badge` | licznik albo krótki stan | `tone`, `icon`, `srLabel` |
| `Icon` | ikona po nazwie | `name`, `size` (`sm` 16 / `md` 18 / `lg` 24), `label` |

Zasady, które z nich wynikają:

- **Jedna akcja `primary` na widok** (Pobierz). Zwykłe akcje to `outline`, akcje w pasku
  narzędzi i poboczne - `ghost`. `danger` oznacza akcję niszczącą; usuwanie owijaj
  w `ConfirmButton`.
- **Rozmiary:** `sm` ma 36 px od 900 px i 40 px na telefonie, `md` - 40 / 44 px. Przycisk
  i pole tego samego rozmiaru mają tę samą wysokość. Pola na telefonie mają tekst 16 px.
- **Szerokość pola** daje rodzic: w `Field` kontrolka rozciąga się sama, poza nim podaj
  `className` (`w-full`, `flex-1`, `w-44`).
- **Stan nie może wisieć na samym kolorze:** przełącznik (`aria-pressed`) zmienia też ikonę
  lub podpis, błąd pola ma ikonę i tekst, aktywna zakładka - pogrubienie i podkreślenie.
- **Element, który nie jest przyciskiem, a ma tak wyglądać** (`<a>` w nawigacji, `<label>`
  nad `<input type="file">`), dostaje klasy z `buttonClass({ variant, size })` ze `styles.ts`;
  analogicznie `fieldClass()` dla pól.
- Typografia interfejsu: 12 px (pigułki), 13 px (etykiety, podpowiedzi, przyciski `sm`),
  14 px (tekst, pola, przyciski `md`), 15 px (nagłówek grupy - `UI_HEADING`). Zaokrąglenia:
  `rounded-lg` (8 px) dla kontrolek, `rounded-xl` (12 px) dla paneli, `rounded-full` dla pigułek.

### Ikony

Ikony pochodzą z `lucide-react`, ale **importuje je tylko `src/components/ui/Icon.tsx`**.
Reszta kodu podaje nazwę z tamtejszej listy: `<Icon name="download" />`,
`<Button icon="download">`. Nowa ikona = import i wpis w mapie `ICONS` (nazwa opisuje
rolę w aplikacji - `saved`, `projects` - a nie rysunek). Nie używaj emoji ani znaków
tekstowych (`↑`, `✎`, `×`) w roli ikon. Ikona bez `label` jest ozdobą (`aria-hidden`);
przycisk z samą ikoną to zawsze `IconButton` z `label`.

### Fokus, ruch, krój

- `index.css` ustawia jeden pierścień `:focus-visible` (2 px, `--focus`) dla wszystkiego,
  co da się sfokusować. Nie dopisuj `focus:outline-none`; pola dosuwają pierścień do krawędzi.
- `prefers-reduced-motion: reduce` wyłącza przejścia i animacje globalnie - komponenty nie
  muszą tego obsługiwać same, ale nie mogą polegać na animacji jako jedynym sygnale.
- Interfejs używa kroju **Hanken Grotesk** (`--font-sans`), tego samego, który jest w paczce
  dla plakatów. Plakaty ustawiają własny krój na `PosterFrame`, więc zmiana kroju
  interfejsu ich nie dotyka.

### `⚠️` Zmienne `:root` są też fallbackiem dla plakatów

`src/posters/schemes.ts` polega na tym, że rola nieprzypisana w schemacie
(`var(--accent)` itp.) spada do `:root` w `index.css`. **Nie zmieniaj nazw
`--accent` / `--bg` / `--text` itd.** bez przejrzenia `schemes.ts`. Bezpieczne jest
dodawanie nowych tokenów; ryzykowne - przemianowanie istniejących.

Z ról plakatów z `:root` koliduje nazwą tylko `--accent` - jego wartości nie ruszaj.
Pozostałe zmienne (`--bg`, `--surface`, `--text`, `--text-muted`, `--input-*`, `--danger`)
czyta wyłącznie interfejs, więc ich wartości można stroić.

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
