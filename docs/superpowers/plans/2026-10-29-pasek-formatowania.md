# Pasek formatowania tekstu — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pływający pasek (B / I / U / S / akcent / wyczyść / wyrównanie) przy zaznaczeniu tekstu na slajdach oraz na podglądzie plakatów i banerów, z formatowaniem zapisanym w polach tekstowych i widocznym w każdym renderze i eksporcie.

**Architecture:** Nowy moduł `src/richText/` jest jedynym źródłem prawdy. Ma format zapisu (string ze znakami z prywatnego obszaru Unicode), czyste operacje na nim, komponent tylko do odczytu `RichText`, komponent edycji `RichEditable` (contentEditable) i pasek `FormatToolbar`. Slajdy podmieniają wnętrze `EditableText` na `RichEditable`. Plakaty dostają `PosterEditContext` i blok `PosterText`, a każdy szablon rysuje pola wolnego tekstu przez `PosterText`. Formularze pokazują rzut na czysty tekst, a zmiany wracają przez `applyPlainEdit`.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, vitest 4 (testy SSR przez `renderToStaticMarkup`, bez DOM-u), style inline, Tailwind w UI aplikacji, ikony lucide-react przez `src/components/ui/Icon.tsx`.

**Spec:** `docs/superpowers/specs/2026-10-29-pasek-formatowania-design.md`

## Global Constraints

- Komentarze, nazwy testów i teksty UI po polsku, w stylu otaczającego kodu.
- Stary zwykły string renderuje się **identycznie** jak dziś, także z `<`, `&`, `*`, `_`, `~`.
- Żadnego `dangerouslySetInnerHTML` z danych; rysowanie tylko przez elementy React. Do DOM-u w `RichEditable` tylko `textContent`/`createElement`.
- Znaczniki nigdy nie trafiają do UI: formularze, nazwy plików, nazwy projektów, kolumny historii, `aria-label`, `document.title`.
- Pasek tylko przy **niepustym** zaznaczeniu w edytowalnym tekście grafiki. Klik w pasek nie zabiera fokusu.
- Wklejanie zawsze jako czysty tekst.
- Na podglądzie plakatu Ctrl/⌘+Z, Ctrl/⌘+Y i Ctrl/⌘+Shift+Z nic nie robią (przechwycone, `preventDefault`).
- Eksport plakatu rysuje wersję statyczną (bez `contentEditable`), identyczną z miniaturami.
- Dane bez formatowania serializują się do zwykłego stringa bez markera (dane, których nikt nie formatował, nie zmieniają się ani o bajt).
- Polecenia weryfikacji: `npm test`, `npm run typecheck`, `npm run lint`.

## Review Focus

1. Wpisanie tekstu tuż po sformatowanym fragmencie albo w pustym polu: nowe znaki dziedziczą styl znaku przed kursorem, a kursor nie skacze (test: `applyPlainEdit` dziedziczy styl, Task 2; ręcznie w przeglądarce, Task 5).
2. Enter na końcu i na środku wyrównanego wiersza: nowy wiersz dziedziczy wyrównanie, a przeglądarka nie zostawia `<div>`/`<br>` w zapisie (test: `splitLine` w Task 2).
3. Pole wyrenderowane `uppercase` (podtytuł Komunikatu/Ogłoszenia) z formatowaniem: zapis zostaje w oryginalnej wielkości liter, render jest wielkimi literami (test SSR w Task 9).
4. Projekt z formatowaniem otwarty po wylogowaniu, w historii i na liście projektów: miniatura pokazuje formatowanie, a kolumny i nazwa są czystym tekstem (testy w Task 4).
5. Wklejenie tekstu z wieloma wierszami do pola jednowierszowego i do pola z wyrównaniem: wiersze sklejone spacją albo rozdzielone zgodnie z `multiline`, bez obcych stylów (test: `insertPlain` w Task 2).

---

## Struktura plików

| Plik | Odpowiedzialność |
|---|---|
| `src/richText/format.ts` | Model (`RichDoc`), parser, serializer, `toPlain`, stałe znaków |
| `src/richText/ops.ts` | Czyste operacje na zakresie `[start, end)` w czystym tekście |
| `src/richText/RichText.tsx` | Render tylko do odczytu (SSR, eksport, miniatury) |
| `src/richText/dom.ts` | DOM ↔ `RichDoc`, zaznaczenie DOM ↔ offsety |
| `src/richText/RichEditable.tsx` | Pole contentEditable z modelem, bez kontekstu domeny |
| `src/richText/FormatToolbar.tsx` | Pasek w portalu + `useFormatToolbar` |
| `src/richText/index.ts` | Barrel |
| `src/posters/blocks/PosterText.tsx` | Pole plakatu: statyczne albo edytowalne zależnie od kontekstu |
| `src/posters/edit.ts` | `PosterEditContext`, `usePosterEdit`, `READ_ONLY_POSTER_EDIT` |

---

### Task 1: Format zapisu

**Files:**
- Create: `src/richText/format.ts`, `src/richText/index.ts`
- Test: `src/richText/format.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const MARK = { bold: 1, italic: 2, underline: 4, strike: 8, accent: 16 } as const
  export type Align = 'left' | 'center' | 'right'
  export interface RichRun { text: string; marks: number }      // text bez '\n'
  export interface RichLine { align: Align; runs: RichRun[] }
  export type RichDoc = RichLine[]                                // zawsze ≥ 1 wiersz
  export function isRich(value: string): boolean
  export function parseRich(value: string): RichDoc
  export function serializeRich(doc: RichDoc): string
  export function toPlain(value: string): string
  export function stripControl(text: string): string            // usuwa znaki U+E000–U+E0FF z tekstu wpisanego/wklejonego
  export function hasFormatting(doc: RichDoc): boolean
  export function hasAlignment(doc: RichDoc): boolean
  ```

**Format (pinned):**
- `U+E000` na początku = string wzbogacony. Bez niego cały string to zwykły tekst (`\n` dzieli wiersze, marks 0, align left).
- Wiersze rozdziela `\n`. Opcjonalnie na początku wiersza `U+E001` = center albo `U+E002` = right.
- Znak `U+E100 + marks` (marks 0–31) ustawia styl dla tekstu, który po nim następuje, aż do następnego znaku stylu albo końca wiersza. Na początku wiersza styl to 0.
- Inne znaki z zakresu U+E000–U+E0FF albo U+E120–U+E1FF wewnątrz wzbogaconego stringa parser pomija (odporność). Starsza aplikacja pokaże je jako niewidoczne/kwadraciki, ale tekst zostanie.
- `serializeRich` łączy sąsiednie runy o tych samych marks, pomija puste runy, nie emituje `U+E100` (marks 0) na początku wiersza i zwraca **zwykły** string bez `U+E000`, gdy `!hasFormatting(doc) && !hasAlignment(doc)`.

- [ ] **Step 1: Napisz testy**

```ts
describe('format tekstu z formatowaniem', () => {
  it('zwykły string to jeden wiersz na linię bez stylów', () => {
    expect(parseRich('Ala <b>&amp;\nkot')).toEqual([
      { align: 'left', runs: [{ text: 'Ala <b>&amp;', marks: 0 }] },
      { align: 'left', runs: [{ text: 'kot', marks: 0 }] },
    ])
  })
  it('obieg parse → serialize zachowuje formatowanie', () => {
    const doc: RichDoc = [
      { align: 'center', runs: [{ text: 'Ala ', marks: 0 }, { text: 'ma', marks: MARK.bold | MARK.accent }] },
      { align: 'left', runs: [{ text: 'kota', marks: MARK.italic }] },
    ]
    expect(parseRich(serializeRich(doc))).toEqual(doc)
    expect(serializeRich(doc).startsWith('\uE000')).toBe(true)
  })
  it('dokument bez formatowania serializuje się do zwykłego stringa', () => {
    expect(serializeRich(parseRich('a\nb'))).toBe('a\nb')
  })
  it('toPlain zdejmuje wszystkie znaczniki', () => {
    expect(toPlain(serializeRich([{ align: 'right', runs: [{ text: 'x', marks: MARK.strike }] }]))).toBe('x')
    expect(toPlain('zwykły\ntekst')).toBe('zwykły\ntekst')
  })
  it('uszkodzone znaczniki nie gubią tekstu', () => {
    expect(toPlain('\uE000a\uE0FFb\uE1FFc')).toBe('abc')
  })
  it('sąsiednie runy o tych samych stylach są łączone', () => {
    const s = serializeRich([{ align: 'left', runs: [{ text: 'a', marks: 1 }, { text: 'b', marks: 1 }] }])
    expect(parseRich(s)[0].runs).toEqual([{ text: 'ab', marks: 1 }])
  })
  it('stripControl usuwa znaki sterujące z wklejonego tekstu', () => {
    expect(stripControl('a\uE000b\uE105c')).toBe('abc')
  })
})
```

- [ ] **Step 2: `npx vitest run src/richText/format.test.ts`**: oczekiwany FAIL (brak modułu)
- [ ] **Step 3: Zaimplementuj `format.ts` według sekcji „Format” i wyeksportuj go z `index.ts`**
- [ ] **Step 4: Ten sam test**: oczekiwany PASS
- [ ] **Step 5: Commit** `feat(richText): format zapisu tekstu z formatowaniem`

---

### Task 2: Operacje na zakresie

**Files:**
- Create: `src/richText/ops.ts`
- Test: `src/richText/ops.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces (wszystkie offsety w `toPlain(value)`, `\n` liczy się jako 1 znak; wszystkie funkcje przyjmują i zwracają **serializowany string**):
  ```ts
  export function marksIn(value: string, start: number, end: number): number   // AND marks znaków w zakresie (0 dla pustego)
  export function toggleMark(value: string, start: number, end: number, mark: number): string
  export function clearMarks(value: string, start: number, end: number): string // zostawia wyrównania
  export function alignIn(value: string, start: number, end: number): Align | null // wspólne wyrównanie dotkniętych wierszy, null gdy różne
  export function setAlign(value: string, start: number, end: number, align: Align): string
  export function insertPlain(value: string, start: number, end: number, text: string, multiline: boolean): { value: string; caret: number }
  export function splitLine(value: string, start: number, end: number): { value: string; caret: number }
  export function applyPlainEdit(value: string, nextPlain: string): string
  ```
- Reguły (pinned):
  - `toggleMark`: jeśli `marksIn & mark` → zdejmij `mark` z zakresu, inaczej nałóż na cały zakres.
  - Wiersze dotknięte przez zakres: każdy wiersz, który zawiera chociaż jeden znak `[start, end)`, a przy pustym zakresie wiersz z kursorem.
  - `insertPlain`/`applyPlainEdit`: wstawiony tekst dziedziczy marks znaku **przed** miejscem wstawienia (na początku wiersza: znaku po nim, w pustym wierszu: 0). Tekst przechodzi przez `stripControl`, a przy `!multiline` zamiana `/\s*[\r\n]+\s*/g` → `' '`.
  - `splitLine`: usuwa zakres, dzieli wiersz, a nowy wiersz dziedziczy `align`.
  - `applyPlainEdit`: wspólny prefiks i sufiks starego i nowego czystego tekstu; środek jak `insertPlain`. Wiersze w nowym środku dziedziczą align wiersza, w którym zaczyna się środek.

- [ ] **Step 1: Napisz testy** (`B = MARK.bold`; `rich(...)` = pomocnik budujący string przez `serializeRich`)

```ts
it('toggleMark pogrubia tylko zaznaczony fragment', () => {
  expect(parseRich(toggleMark('Ala ma kota', 4, 6, B))[0].runs).toEqual([
    { text: 'Ala ', marks: 0 }, { text: 'ma', marks: B }, { text: ' kota', marks: 0 }])
})
it('toggleMark na w pełni pogrubionym zakresie zdejmuje styl i wraca do zwykłego stringa', () => {
  expect(toggleMark(toggleMark('abc', 0, 3, B), 0, 3, B)).toBe('abc')
})
it('toggleMark na częściowo pogrubionym zakresie pogrubia całość', () => {
  expect(marksIn(toggleMark(toggleMark('abcd', 0, 2, B), 0, 4, B), 0, 4) & B).toBe(B)
})
it('setAlign zmienia tylko wiersze dotknięte zaznaczeniem', () => {
  const doc = parseRich(setAlign('a\nb\nc', 2, 3, 'center'))
  expect(doc.map((l) => l.align)).toEqual(['left', 'center', 'left'])
})
it('alignIn zwraca null przy różnych wyrównaniach', () => {
  expect(alignIn(setAlign('a\nb', 0, 1, 'right'), 0, 3)).toBeNull()
})
it('clearMarks zostawia wyrównanie', () => {
  const v = clearMarks(setAlign(toggleMark('abc', 0, 3, B), 0, 0, 'right'), 0, 3)
  expect(parseRich(v)).toEqual([{ align: 'right', runs: [{ text: 'abc', marks: 0 }] }])
})
it('applyPlainEdit: tekst dopisany za pogrubieniem jest pogrubiony, reszta bez zmian', () => {
  const v = applyPlainEdit(toggleMark('Ala kot', 0, 3, B), 'Alaaa kot')
  expect(parseRich(v)[0].runs).toEqual([{ text: 'Alaaa', marks: B }, { text: ' kot', marks: 0 }])
})
it('applyPlainEdit: usunięcie fragmentu zabiera jego formatowanie', () => {
  expect(applyPlainEdit(toggleMark('Ala kot', 0, 3, B), ' kot')).toBe(' kot')
})
it('applyPlainEdit: wyrównania idą za wierszami przy dopisaniu wiersza na początku', () => {
  const v = applyPlainEdit(setAlign('a\nb', 2, 3, 'right'), 'x\na\nb')
  expect(parseRich(v).map((l) => l.align)).toEqual(['left', 'left', 'right'])
})
it('splitLine: nowy wiersz dziedziczy wyrównanie', () => {
  const { value, caret } = splitLine(setAlign('abcd', 0, 0, 'center'), 2, 2)
  expect(parseRich(value).map((l) => l.align)).toEqual(['center', 'center'])
  expect(caret).toBe(3)
})
it('insertPlain: wklejone wiersze w polu jednowierszowym sklejone spacją, bez znaków sterujących', () => {
  expect(insertPlain('ab', 1, 1, 'x\n\ny\uE105', false)).toEqual({ value: 'ax yb', caret: 4 })
})
```

- [ ] **Step 2: `npx vitest run src/richText/ops.test.ts`**: FAIL
- [ ] **Step 3: Zaimplementuj `ops.ts`.** Najprościej: rozwiń dokument do tablicy znaków `{ ch, marks }` z wierszami jako `{ align }`, zmodyfikuj ją i zwiń z powrotem przez `serializeRich`.
- [ ] **Step 4: Ten sam test**: PASS
- [ ] **Step 5: Commit** `feat(richText): operacje formatowania na zaznaczonym zakresie`

---

### Task 3: `RichText` — render tylko do odczytu

**Files:**
- Create: `src/richText/RichText.tsx`
- Modify: `src/slides/SlideView.tsx` (korzeń slajdu: `['--rich-accent' as string]: 'var(--s-accent)'`)
- Test: `src/richText/RichText.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface RichTextProps {
    value: string
    // Pole w linii (InfoLine, pigułki, plakietki): wyrównania ignorowane, nigdy bloki.
    inline?: boolean
  }
  export function RichText(props: RichTextProps): ReactNode   // fragment, bez własnego elementu-otoczki
  export function runStyle(marks: number): CSSProperties | undefined
  ```
- Render (pinned):
  - zwykły string → sam tekst (dokładnie ten sam węzeł tekstowy co dziś);
  - run z marks → `<span style={runStyle(marks)}>`, gdzie bold = `fontWeight: 'bolder'`, italic = `fontStyle: 'italic'`, underline i strike razem w `textDecorationLine`, accent = `color: 'var(--rich-accent, var(--accent))'`;
  - `hasAlignment && !inline` → każdy wiersz jako `<div style={{ textAlign }}>` (`left` = bez `textAlign`), pusty wiersz jako `<div><br /></div>`; inaczej wiersze łączone `'\n'` (rodzic ma `white-space: pre-line`).

- [ ] **Step 1: Testy SSR**
  - `render(h(RichText, { value: 'a<b>&\nc' }))` === `'a&lt;b&gt;&amp;\nc'`
  - pogrubiony + akcent run daje `<span style="font-weight:bolder;color:var(--rich-accent, var(--accent))">`
  - podkreślenie + przekreślenie daje `text-decoration-line:underline line-through`
  - wiersz center daje `<div style="text-align:center">`, a `inline: true` dla tego samego value nie daje żadnego `<div`
- [ ] **Step 2: FAIL → Step 3: implementacja → Step 4: PASS**
- [ ] **Step 5: Commit** `feat(richText): RichText rysuje formatowanie`

---

### Task 4: Czysty tekst poza grafiką i wersje zapisu

**Files:**
- Modify: `src/snapshot/snapshot.ts` (`SNAPSHOT_VERSION = 2`; `parseSnapshot` przyjmuje v 1 i 2 i zwraca v 2), `src/slides/types.ts` (`DECK_VERSION = 2`; `parseDeck` już przyjmuje starsze)
- Modify: `src/history/remoteHistory.ts` (`newHistoryEntry`: `toPlain` na `title`, `subtitle`, `speaker`, `location`)
- Modify: `src/App.tsx:139` (`toPlain(form.title)` do nazwy pliku), `src/workspace/syncEngine.ts:116` (`projectNameFrom(toPlain(sent.form.title))`)
- Modify: `src/forms/FormField.tsx` (`value: toPlain(value[name])`, `onChange` → `setField(name, applyPlainEdit(value[name], e.target.value))`), `src/forms/FormKonferencja.tsx` (agenda tak samo), `src/components/slides/Inspector.tsx:166-172` (pola pozycji list tak samo)
- Test: `src/snapshot/snapshot.test.ts`, `src/history/remoteHistory.test.ts`, `src/forms/EditorPanels.test.ts`, `src/slides/deck.test.ts`

**Interfaces:**
- Consumes: `toPlain`, `applyPlainEdit` (Tasks 1–2).

- [ ] **Step 1: Testy**
  - `parseSnapshot({ ...validV1 })` → `ok: true`, `snapshot.v === 2`; `v: 3` → `reason: 'newer'`
  - `newHistoryEntry(snapshotWith({ title: toggleMark('Ala', 0, 3, MARK.bold) })).title === 'Ala'`; `snapshot.form.title` zachowuje marker
  - `FormField` z `title` sformatowanym: `<textarea>` zawiera `Ala`, a w HTML nie ma `\uE000` ani `\uE101`
  - `parseDeck({ id: 'a', v: 1, slides: [] })` → `ok: true`, `deck.v === 2`
- [ ] **Step 2: FAIL → Step 3: zmiany z listy Files → Step 4: `npm test`**: PASS (popraw istniejące asercje `v: 1`)
- [ ] **Step 5: Commit** `feat(richText): czysty tekst w formularzach, historii i nazwach; wersje zapisu`

---

### Task 5: `RichEditable` — edycja z formatowaniem w contentEditable

**Files:**
- Create: `src/richText/dom.ts`, `src/richText/RichEditable.tsx`
- Modify: `src/slides/komponenty/_tekst.tsx` (przenieś `normalizeEditedText`, `placeCaretAtEnd` i wykrywanie `plaintext-only` tam, gdzie będą potrzebne; `normalizeEditedText` zostaje eksportowane z `_tekst.tsx` dla testów)
- Test: `src/richText/RichEditable.test.ts` (SSR)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  ```ts
  // dom.ts
  export function renderDoc(el: HTMLElement, value: string, opts: { inline: boolean }): void // przez createElement/textContent
  export function readDoc(el: HTMLElement): string        // DOM → serializowany string
  export function getOffsets(el: HTMLElement): { start: number; end: number } | null
  export function setOffsets(el: HTMLElement, start: number, end: number): void

  // RichEditable.tsx
  export interface RichEditableProps {
    value: string
    onChange: (value: string) => void
    as?: EditableTag              // przeniesiony typ z _tekst.tsx
    style?: CSSProperties
    multiline?: boolean
    // Czy pole obsługuje wyrównanie wierszy (domyślnie false → przyciski wyszarzone).
    alignable?: boolean
    placeholder?: string
    ariaLabel: string
    // Atrybut, po którym pasek i CSS rozpoznają pole (np. 'data-slide-edit').
    marker: 'data-slide-edit' | 'data-poster-edit'
    // Dodatkowa obsługa klawiszy przed domyślną (np. blokada cofania na plakacie).
    onKeyDownCapture?: (event: KeyboardEvent<HTMLElement>) => void
  }
  export function RichEditable(props: RichEditableProps): ReactElement
  ```
- Zachowanie (pinned, zachowuje kontrakt dzisiejszego `EditableField`):
  - `contentEditable` = `true` (nie `plaintext-only`, bo przeglądarka musi trzymać spany). Treść niekontrolowana. `useLayoutEffect` na `value` ≠ `lastSynced` → `renderDoc` i przywrócenie offsetów, gdy pole ma fokus.
  - `beforeinput`: `insertParagraph`/`insertLineBreak` → `splitLine` (multiline) albo blur (jednowierszowe); `insertFromPaste`/`insertFromDrop` → `insertPlain`; `formatBold`/`formatItalic`/`formatUnderline` → `toggleMark`; `historyUndo`/`historyRedo` → `preventDefault` (cofaniem steruje właściciel). Każda z tych operacji to `preventDefault`, nowy `value`, `renderDoc`, `setOffsets(caret)` i `onChange`.
  - `input` (zwykłe pisanie/kasowanie): `readDoc` → jeśli różni się od `lastSynced`: `onChange`. Jeśli DOM nie jest kanoniczny (np. przeglądarka dodała `<b>`, `<div>`, `<br>` w środku), robimy `renderDoc` z przywróceniem offsetów.
  - `blur`: `renderDoc(lastSynced)` (czyści śmieci przeglądarki).
  - Escape → blur; skróty Ctrl/⌘+Z/Y/S przepuszczane w górę jak dziś, reszta `stopPropagation`.
  - Pusty: atrybut `data-empty` i `data-placeholder` jak dziś.
  - `onPointerDown` → `stopPropagation` jak dziś.
  - Rejestruje się w `useFormatToolbar` (Task 6) przez `data-rich-field` oraz handler `applyFormat(op)` dostępny przez ref/rejestr (szczegół wykonawcy).

- [ ] **Step 1: Testy SSR**: tag otwierający ma `contentEditable="true"`, `role="textbox"`, `aria-label`, atrybut `marker`, `data-empty` przy pustym, `data-alignable` przy `alignable`. Istniejące testy `EditableText` w `_tekst.test.ts` mają `contentEditable="plaintext-only"`: zmień je na `"true"`.
- [ ] **Step 2: FAIL → Step 3: implementacja → Step 4: `npm test` PASS**
- [ ] **Step 5: Commit** `feat(richText): RichEditable - pole contentEditable z formatowaniem`

---

### Task 6: Pasek formatowania

**Files:**
- Create: `src/richText/FormatToolbar.tsx`
- Modify: `src/components/ui/Icon.tsx` (ikony: `bold: Bold`, `italic: Italic`, `underline: Underline`, `strike: Strikethrough`, `alignLeft: AlignLeft`, `alignCenter: AlignCenter`, `alignRight: AlignRight`, `clearFormat: RemoveFormatting`; akcent używa istniejącej `palette`)
- Modify: `src/App.tsx` (jeden `<FormatToolbar />` w drzewie aplikacji)
- Test: `src/richText/FormatToolbar.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 5.
- Produces:
  ```ts
  export type FormatOp = { kind: 'mark'; mark: number } | { kind: 'clear' } | { kind: 'align'; align: Align }
  export interface ToolbarState { marks: number; align: Align | null; alignable: boolean }
  export function ToolbarButtons(props: { state: ToolbarState; onFormat: (op: FormatOp) => void }): ReactElement // czysty widok, testowalny SSR
  export function FormatToolbar(): ReactElement | null   // portal do document.body
  ```
- Zachowanie (pinned):
  - Nasłuch `selectionchange`: pasek pokazuje się, gdy zaznaczenie jest niepuste i leży całe w jednym `[data-rich-field]`. Pozycja: `range.getBoundingClientRect()`, wyśrodkowany nad zaznaczeniem, 8 px odstępu. Gdy brak miejsca u góry, pod zaznaczeniem. Przycięty do okna z marginesem 8 px. `position: fixed`, aktualizacja przy scrollu i resize.
  - Chowa się: puste zaznaczenie, blur pola (poza paskiem), Escape.
  - Przyciski: `onPointerDown={e => e.preventDefault()}` (fokus i zaznaczenie zostają).
  - Kolejność i etykiety: „Pogrubienie (Ctrl+B)”, „Kursywa (Ctrl+I)”, „Podkreślenie (Ctrl+U)”, „Przekreślenie”, „Kolor akcentu”, „Wyczyść formatowanie” | „Do lewej”, „Do środka”, „Do prawej”. Na Macu zamiast „Ctrl” jest „⌘” (`isMacPlatform` z `shortcuts.ts`).
  - `role="toolbar"`, `aria-label="Formatowanie tekstu"`; przełączniki z `aria-pressed`; wyrównania przy `!alignable` mają `aria-disabled="true"` i `title="Wyrównanie niedostępne w tym polu"`. Strzałki lewo/prawo przenoszą fokus między przyciskami (roving tabindex).
  - Wygląd: `IconButton` z `src/components/ui`, tło i obramowanie z tokenów (`stylowanie.md`), cień jak `Popover`.

- [ ] **Step 1: Testy SSR `ToolbarButtons`**
  - `state.marks = MARK.bold` → przycisk „Pogrubienie…” ma `aria-pressed="true"`, „Kursywa…” ma `aria-pressed="false"`
  - `alignable: false` → trzy przyciski wyrównania mają `aria-disabled="true"`
  - `align: 'center'` → „Do środka” ma `aria-pressed="true"`
  - korzeń ma `role="toolbar"` i `aria-label="Formatowanie tekstu"`
- [ ] **Step 2: FAIL → Step 3: implementacja → Step 4: PASS**
- [ ] **Step 5: Commit** `feat(richText): pływający pasek formatowania`

---

### Task 7: Slajdy na `RichEditable` i `RichText`

**Files:**
- Modify: `src/slides/komponenty/_tekst.tsx` (`EditableText`: `StaticText` rysuje `<RichText value inline={!multiline} />` w tym samym elemencie; `EditableField` = `RichEditable` z `onChange={(v) => onText(path, v)}`, `marker="data-slide-edit"`, `alignable={multiline}`; `EditableTextProps` dostaje opcjonalne `alignable?: boolean`, które nadpisuje domyślne `multiline`)
- Modify: `src/slides/export/html.ts` (`EDITOR_ATTRS` + `'data-rich-field'`, `'data-alignable'`)
- Modify: `src/index.css` (selektory `[data-slide-edit]` bez zmian w działaniu)
- Test: `src/slides/komponenty/_tekst.test.ts`, `src/slides/export/html.test.ts`

- [ ] **Step 1: Testy**
  - poza edytorem `EditableText` ze sformatowanym `value` → `<p style="white-space:pre-line">Ala <span style="font-weight:bolder">ma</span></p>`
  - poza edytorem zwykły tekst → dotychczasowe asercje bez zmian (zgodność wsteczna)
  - eksport HTML slajdu ze sformatowanym tekstem zawiera `font-weight:bolder` i nie zawiera `data-rich-field`, `contenteditable` ani `\uE000`
- [ ] **Step 2: FAIL → Step 3 → Step 4: `npm test` PASS**
- [ ] **Step 5: Ręcznie** (skill `run`): w edytorze prezentacji zaznacz słowo → pasek; B, akcent, wyrównanie w liście; Ctrl+Z cofa formatowanie (historia talii); miniatura i eksport HTML pokazują style.
- [ ] **Step 6: Commit** `feat(slides): formatowanie tekstu na slajdach`

---

### Task 8: Kontekst edycji plakatu, `PosterText` i podgląd

**Files:**
- Create: `src/posters/edit.ts`, `src/posters/blocks/PosterText.tsx`
- Modify: `src/components/PreviewPane.tsx`, `src/pages/EditorPage.tsx` (przekazanie `onChange={editor.updateForm}`), `src/editor/usePosterExport.ts` albo `src/App.tsx:128-140` (eksport statyczny)
- Modify: `src/index.css` (`[data-poster-edit]` z tymi samymi stylami hover/focus co `[data-slide-edit]`)
- Test: `src/posters/blocks/PosterText.test.ts`

**Interfaces:**
- Consumes: Tasks 3, 5.
- Produces:
  ```ts
  // edit.ts
  export interface PosterEdit {
    editable: boolean
    // `path`: nazwa pola formularza (`title`) albo pozycja listy (`lists.agenda.2.title`).
    onText: (path: string, value: string) => void
  }
  export const READ_ONLY_POSTER_EDIT: PosterEdit
  export const PosterEditContext: Context<PosterEdit>
  export function usePosterEdit(): PosterEdit
  export function setFormPath(path: string, value: string): FormUpdate   // pole albo lists.<klucz>.<i>.<pole>

  // PosterText.tsx
  export interface PosterTextProps {
    path: string
    value: string | null | undefined     // surowa wartość (może być pusta)
    fallback?: string                    // wartość przykładowa / domyślna, gdy pusta
    as?: EditableTag
    style?: CSSProperties
    multiline?: boolean
    inline?: boolean                     // pole w linii: bez wyrównań
    transform?: 'uppercase'              // render przez CSS text-transform, zapis bez zmian
    label: string                        // aria-label edytora, np. „Tytuł”
  }
  export function PosterText(props: PosterTextProps): ReactElement
  ```
- Zachowanie (pinned):
  - Bez edycji: element `as` ze `style` (i `textTransform: 'uppercase'` przy `transform`), w środku `<RichText value={value || fallback} inline={inline} />`. Dla zwykłego tekstu wynik SSR jest identyczny z dzisiejszym, poza dodanym `text-transform` w polach z `transform`.
  - Edycja: `RichEditable` z `marker="data-poster-edit"`, `alignable={multiline && !inline}`, `placeholder={fallback}`, `onChange={(v) => onText(path, v)}`. Pusty pokazuje `fallback` przez `::before` (jak slajdy).
  - `onKeyDownCapture`: Ctrl/⌘+Z, Ctrl/⌘+Y, Ctrl/⌘+Shift+Z → `preventDefault()` + `stopPropagation()`.
  - Podgląd w edytorze: `PreviewPane` owija `PosterPreview` w `PosterEditContext.Provider value={{ editable: !exporting, onText: (p, v) => onChange(setFormPath(p, v)) }}`.
  - Eksport: przed `downloadPoster` `flushSync(() => setExporting(true))`, a w `finally` `setExporting(false)`, żeby węzeł eksportu był statyczny. Miniatury, historia, lista projektów i `PosterPreviewPage` nie mają providera, więc są statyczne domyślnie.
- [ ] **Step 1: Testy SSR**
  - `PosterText` bez providera, `value: ''`, `fallback: 'X'` → `<div ...>X</div>`, bez `contenteditable`
  - z providerem `editable: true` → `contentEditable="true"`, `data-poster-edit`, `data-placeholder="X"`, `data-empty`
  - `transform: 'uppercase'` → `text-transform:uppercase`, a tekst w HTML w oryginalnej wielkości
  - `setFormPath('lists.agenda.1.title', 'x')(form)` zmienia tylko tę pozycję
- [ ] **Step 2: FAIL → Step 3 → Step 4: PASS**
- [ ] **Step 5: Commit** `feat(posters): edycja tekstu na podglądzie plakatu`

---

### Task 9: Plakaty (9 layoutów) przez `PosterText`

**Files:**
- Modify: `src/posters/Poster{Wyklad,Warsztat,Konferencja,Rekrutacja,Data,Gosc,Gala,Ogloszenie,Komunikat}.tsx`, `src/posters/blocks/{Badge,InfoLine}.tsx` (gdy pole przechodzi przez blok, blok przyjmuje `ReactNode` albo `path`)
- Test: `src/posters/richFields.test.ts` (nowy), `src/posters/lineBreaks.test.ts` (bez zmian, musi przejść)

**Reguła:** każde wyrenderowanie `title`, `subtitle`, `speaker`, `location`, `badge`, `badge2`, `body` oraz tekstów pozycji `lists.*` idzie przez `PosterText` z `path` = nazwa pola. `fallback` przejmuje to, co dziś daje `withPlaceholders` lub `||` (np. `DEFAULT_BADGE.komunikat[lang]`). `withPlaceholders` zwraca dodatkowo surowe `raw: RawPosterData`, z którego bierzemy `value`. `multiline` mają pola, które dziś są `textarea` (`fields.ts` i `Form*.tsx`). `inline` mają pola wewnątrz linii lub pigułki (InfoLine, pigułki, plakietki). `x.toUpperCase()` → `transform="uppercase"`. Stały prefiks (`— `) zostaje poza `PosterText`. Pole wpisane w string (np. sklejone z `·`) rozbij na elementy. Wątpliwe przypadki wypisz w opisie commita.

- [ ] **Step 1: Test dla każdego layoutu** (pętla po `posterRegistry`):
  - `title` z pogrubionym słowem renderuje `font-weight:bolder`, a HTML nie zawiera `\uE000`/`\uE101`
  - `data: {}` daje HTML identyczny z wynikiem sprzed zmian: zapisz go przed zmianą jako snapshot vitest (`toMatchSnapshot()`) w osobnym, wcześniejszym commicie
  - Komunikat/Ogłoszenie: `subtitle: 'abc'` → `text-transform:uppercase` i `— ` poza elementem z tekstem
- [ ] **Step 2: Commit snapshotów „przed”** (test na `data: {}` i na danych z `<&` w tytule), potem FAIL testów formatowania
- [ ] **Step 3: Przepisz layouty**
- [ ] **Step 4: `npm test`**: PASS; snapshoty „przed” niezmienione, poza dopisanym `text-transform` (zaktualizuj świadomie i opisz w commicie)
- [ ] **Step 5: Ręcznie** (skill `run`): klik w tytuł na podglądzie → edycja, pasek, Ctrl+Z nic nie robi, Delete/strzałki nie ruszają edytora, formularz pokazuje czysty tekst; pobierz PNG i PDF → formatowanie jest, obrysu i kursora nie ma.
- [ ] **Step 6: Commit** `feat(posters): formatowanie tekstu w layoutach plakatów`

---

### Task 10: Banery (10 layoutów) przez `PosterText`

**Files:**
- Modify: `src/posters/banners/Banner*.tsx`, `src/posters/banners/common.tsx`
- Test: `src/posters/banners/banners.test.ts`

Ta sama reguła i te same kroki co Task 9 (snapshot „przed”, test pogrubienia w tytule każdego banera, `toUpperCase` → `transform`). `SITE_URL.toUpperCase()` i inne teksty z `copy.ts` zostają bez zmian (nieedytowalne).

- [ ] **Step 1–4** jak Task 9, pętla po `posterRegistry[*].Banner`
- [ ] **Step 5: Commit** `feat(banners): formatowanie tekstu w banerach`

---

### Task 11: Dokumentacja

**Files:**
- Modify: `docs/architektura.md` (moduł `src/richText/`, `PosterEditContext`, format zapisu w jednym akapicie), `docs/dodawanie-szablonu.md` (pola wolnego tekstu przez `PosterText`: `path`, `fallback`, `multiline`, `inline`, `transform`), `docs/dodawanie-slajdu.md` (`EditableText` z `alignable`)

- [ ] **Step 1: Zaktualizuj dokumenty**
- [ ] **Step 2: `npm test && npm run typecheck && npm run lint`**: wszystko zielone
- [ ] **Step 3: Commit** `docs: formatowanie tekstu`
