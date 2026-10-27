# Dodawanie nowego układu slajdu

Przykład: dodajemy układ `pytanie` ("Pytanie"): duże pytanie z krótką
odpowiedzią pod spodem.

Nazewnictwo: `key` to krótki, mały wyraz bez spacji (`pytanie`), używany
w rejestrze i w zapisanych prezentacjach. Plik i komponent to `Pytanie`
(`komponenty/Pytanie.tsx`).

Wszystkie układy leżą w **jednym folderze**: `src/slides/komponenty/`. Jeden
plik = jeden układ, a w nim wszystko, czego układ potrzebuje: treść domyślna,
pola panelu właściwości i rysunek. Nowego układu nie dopisuje się do
`types.ts` ani do edytora - rejestr (`komponenty/index.ts`) i `defineSlide`
wystarczą.

## 1. Kopia wzorca

Zacznij od kopii `src/slides/komponenty/Cytat.tsx` - to najmniejszy
kompletny układ. Zmień nazwę pliku i komponentu, resztę przepisz:

```bash
cp src/slides/komponenty/Cytat.tsx src/slides/komponenty/Pytanie.tsx
```

## 2. Treść domyślna - `defaults`

`defaults` to jednocześnie **typ danych slajdu** (`typeof defaults` jest typem
`data` komponentu) i treść, którą dostaje nowy slajd tego układu. Treść to
polski placeholder, który od razu wygląda dobrze na slajdzie:

```ts
const defaults = {
  kicker: 'Pytanie',
  question: 'Dlaczego warto przyjść na pierwsze spotkanie?',
  answer: 'Bo na spotkaniu poznasz ludzi, którzy lubią matematykę tak samo jak ty.',
}
```

Zasady:

- Każde pole to `string`, `boolean`, zdjęcie (`PhotoValue`) albo lista pozycji
  (`SlideItem[]`, same pola tekstowe). Typ wynika z wartości, nie z osobnej
  deklaracji.
- Klucze to kontrakt: patrz „Czego nie robić" na końcu.

## 3. Rysunek - `Component`

Komponent dostaje `{ data }` i rysuje układ w **pełnym rozmiarze układu**
(`SLIDE_SIZE`: 16:9 = 1600×900, 1:1 = 1200×1200 px). Skalowaniem zajmuje się
podgląd i eksport, więc piszesz w tych jednostkach, bez `vw`, `%` na wysokość
ekranu i bez media queries.

### Kolory: tylko role `var(--s-…)`

Komponent **nie zna motywu**. Kolory biera z ról, które `paletteVars` rozlewa
na korzeń slajdu (`themes.ts`):

| Rola | Znaczenie |
|------|-----------|
| `--s-bg` | tło slajdu |
| `--s-fg` | główny tekst |
| `--s-muted` | podpisy, opisy kart, numer slajdu |
| `--s-accent` | nagłówki, plakietka (kicker), obramowania kart |
| `--s-on-accent` | tekst na wypełnieniu `--s-accent` |
| `--s-soft` | tło kart, tagów i plakietek |
| `--s-soft-fg` | tekst na `--s-soft` |
| `--s-band` | trójkąty w pasie na dole i cień zdjęcia |
| `--s-frame` | ramka drugiego zdjęcia |

Zmiana motywu albo tła slajdu (jasne / ciemne) przerysowuje układ sam, bez
zmian w komponencie.

### Rozmiar i reflow 1:1

Gdy układ ma wyglądać inaczej w kwadracie, pytaj o proporcję hookiem
`useSlideAspect()` (jak w `Cytat.tsx`: `const square = useSlideAspect() === '1:1'`).
Kwadrat ma mniej szerokości, więc zwykle zmienia się liczba kolumn, wysokość
pudełka albo odstępy.

### Lustro i tło

- `useSlideRender().mirrored` mówi, że slajd jest odwrócony (tekst po prawej,
  zdjęcia po lewej). Układy z zdjęciem same przestawiają kolumny; nie odwracaj
  ich ręcznie.
- Tło nowego slajdu ustawia pole `background: 'ciemne'` w definicji (tak robi
  `Tytul` i `Zaproszenie`). Bez niego slajd startuje jasny. Użytkownik może
  zmienić tło każdego slajdu osobno.

## 4. Klocki - `komponenty/_wspolne.tsx`

Powtarzalne elementy bierz stamtąd zamiast pisać od zera:

| Klocek | Do czego |
|--------|----------|
| `SlideFrame` | korzeń każdego slajdu: rozmiar, kolory, sygnet, pas trójkątów, numer. Props `padding`, `sygnet`, `band`, `number` wyłączają ozdoby w konkretnym układzie |
| `Kicker` | plakietka nad nagłówkiem (trójkąt + wersaliki): `<Kicker path="kicker" value={data.kicker} />` |
| `Chip` | prostokątna plakietka na `--s-soft`: miejsce, tag, data |
| `PhotoFigure` | zdjęcie z kadrem i wariantem `cien` / `ramka` / `zwykle`, z podpisem: `<PhotoFigure photo={data.photo} variant="cien" caption={{ path: 'caption', value: data.caption }} />` |
| `Step` | element „pokazuj po kolei": `<Step index={i + 1}>…</Step>` |
| `EditableText` | tekst widoczny na slajdzie, edytowalny w miejscu: `<EditableText path="question" value={data.question} as="h2" placeholder="Pytanie" style={…} />` |
| `AutoFit` + `fit(px)` | dopasowanie fontu do pudełka: `<AutoFit id="question" style={{ maxHeight: 400 }}>` otacza `EditableText`, a `fontSize: fit(96)` daje rozmiar, który AutoFit może zmniejszyć |
| `TriangleBand` | pas trójkątów na dole (już jest w `SlideFrame`, zwykle nie trzeba go wołać) |
| `SlideNumber` | numer „01 / 11" (też już jest w `SlideFrame`) |

`EditableText` przyjmuje `path` z kropkami, więc elementy listy edytuje się
tak samo: `path={\`cards.${i}.title\`}`. Ścieżka musi istnieć w `data`, inaczej
zapis jest ignorowany.

`AutoFit` zmniejsza font, dopóki tekst mieści się w `maxHeight` / `maxWidth`
(nie mniej niż 70%). Tekst, który nawet wtedy nie mieści się, edytor pokazuje
jako przepełniony. Każdy długi tekst na slajdzie owijaj w `AutoFit`.

## 5. Pola panelu - `fields`

Panel właściwości (po prawej w edytorze) pokazuje **tylko to, czego nie da się
kliknąć i wpisać na slajdzie**. Tekst widoczny na slajdzie edytuje się na
slajdzie (`EditableText`), więc **nie dodawaj go jako pola**. Dostępne rodzaje:

| `kind` | Co daje | Przykład |
|--------|---------|----------|
| `photo` | zdjęcie z kadrowaniem (`PhotoValue`) | `{ kind: 'photo', key: 'photo', label: 'Zdjęcie' }` |
| `list` | lista pozycji (karty, wpisy, tagi): `itemFields`, `newItem`, `min`, `max` | `Karty.tsx` (karty w siatce) |
| `select` | wybór wariantu z listy opcji | `Karty.tsx` (`variant`: siatka / numerowana) |
| `toggle` | przełącznik tak / nie | `TekstZdjecia.tsx` (`showPhoto2`) |
| `text` | tekst **niewidoczny** jako napis na slajdzie (np. link w kodzie QR) | `Qr.tsx` |

Przykład listy z `Karty.tsx`:

```ts
{
  kind: 'list',
  key: 'cards',
  label: 'Karty',
  itemLabel: 'Karta',
  itemFields: [
    { key: 'title', label: 'Tytuł' },
    { key: 'text', label: 'Opis', multiline: true },
  ],
  newItem: { title: 'Nowa karta', text: 'Opis' },
  min: 1,
  max: 9,
}
```

`newItem` musi mieć **wszystkie** klucze pozycji, bo edycja wpisuje wartości
po ścieżce. `key` w polu musi istnieć w `defaults` (TypeScript pilnuje tego
przy kompilacji).

## 6. Kroki „pokazuj po kolei" - `steps`

Jeśli układ ma elementy, które pojawiają się kolejno (karty, wpisy, tagi),
zdefiniuj `steps` i owiń każdy taki element w `<Step>`:

```tsx
{data.answers.map((a, i) => (
  <Step key={i} index={i + 1}>…</Step>
))}
```

`steps(data)` zwraca liczbę kroków, np. `(d) => d.cards.length`. Numery
`index` zaczynają się od 1. Element jest widoczny, gdy bieżący krok ≥ `index`.
W edytorze, na miniaturach i w eksporcie wszystko jest widoczne. Pokaz
(`present.ts`) przechodzi po kolei przez kroki, zanim przejdzie do następnego
slajdu. Krok liczy się tylko wtedy, gdy użytkownik włączył „pokazuj po kolei"
na tym slajdzie.

## 7. Rejestracja

Jedna linia importu i jedna pozycja w `komponenty/index.ts`, w miejscu, w
którym układ ma stać w galerii „Nowy slajd" (kolejność w obrębie grupy):

```ts
import Pytanie from './Pytanie'
// …
export const SLIDE_LAYOUTS: readonly SlideDefinition[] = [
  // …
  Pytanie,
]
```

Pozostałe pola definicji (`key`, `label`, `description` - jedno zdanie w
galerii, `group` - jedna z czterech grup z `defineSlide.ts`, `icon` - nazwa
z `components/ui/Icon.tsx`) ustawiasz w `defineSlide({...})` na końcu pliku.
Jeśli potrzebnej ikony nie ma, dopisz ją w `Icon.tsx` do istniejącej mapy.

## 8. Testy

Dodaj test w tym samym folderze, wzorując się na `komponenty/uklady9.test.ts`:
renderuje układ z `defaults` w obu proporcjach i sprawdza teksty domyślne.
Jeśli układ ma kroki, sprawdź ich liczbę:

```ts
import { describe, expect, it } from 'vitest'
import { h, render } from '../../components/ui/testUtils'
import { DEFAULT_RENDER_INFO, SlideRenderContext } from '../defineSlide'
import type { SlideAspect } from '../types'
import Pytanie from './Pytanie'

function html(aspect: SlideAspect): string {
  return render(
    h(SlideRenderContext.Provider, { value: { ...DEFAULT_RENDER_INFO, aspect } }, h(Pytanie.Component, { data: Pytanie.defaults })),
  )
}

describe('Pytanie', () => {
  it.each(['16:9', '1:1'] as SlideAspect[])('rysuje domyślne teksty (%s)', (aspect) => {
    const out = html(aspect)
    expect(out).toContain('Dlaczego warto przyjść na pierwsze spotkanie?')
  })
})
```

Potem `npm test` (vitest) i `npm run build` (typecheck `tsc` + build). Samą
przeglądarkę sprawdź w edytorze prezentacji: nowy układ w galerii, zmiana
motywu, kwadrat 1:1, długi tekst (czy AutoFit go mieści) i eksport PNG.

## Czego nie robić

- **Hexy i nazwane kolory w komponencie.** Wyłącznie `var(--s-…)`. Hexy żyją
  tylko w `themes.ts`. Stały kolor w układzie psuje motyw i ciemne tło.
- **Tailwind w slajdach.** Slajdy mają style inline (jak plakaty, patrz
  [stylowanie.md](./stylowanie.md)). Slajd ma wyglądać tak samo w podglądzie,
  w PNG i w HTML, a style inline to jedyna forma, którą eksport kopiuje
  bez zależności od pliku CSS aplikacji.
- **Zmiana nazw kluczy `defaults` w istniejącym układzie.** Zapisane
  prezentacje trzymają dane po kluczach. `parseDeck` (`deck.ts`) nie odrzuca
  takich slajdów, tylko naprawia je: pola, których nie ma w `defaults`, znikają,
  a brakujące dostają wartość domyślną. Po zmianie nazwy tekst użytkownika po
  cichu zamienia się w placeholder. Nowe pole dopisuj; starego nie zmieniaj.
  To samo dotyczy zmiany `key` układu: zapisane slajdy z nieznanym kluczem
  wypadają z prezentacji.
- **Zły typ wartości w danych.** Źle wpisane pole (np. liczba zamiast tekstu)
  też wraca do wartości domyślnej, bez ostrzeżenia. Trzymaj się typów z
  `defaults`.
- **Pola panelu dla tekstu widocznego na slajdzie.** To `EditableText`, nie
  `fields`. Pole `text` jest tylko dla treści niewidocznej.
- **Własne mechanizmy zapisu zdjęć.** Zdjęcie to `PhotoValue` z `src` jako data
  URL. Zapis w IndexedDB robi `deckStore`, który zamienia je na nazwy grafik.
  Układ nie zapisuje niczego sam.
