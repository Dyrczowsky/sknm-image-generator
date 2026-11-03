# Tekst wydarzenia na banerach — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Banery dostają własny, edytowalny duży tekst (domyślnie nazwa koła) i opcjonalną linię z datą, godziną i miejscem wydarzenia.

**Architecture:** `bannerTitle` staje się zwykłym polem tekstowym formularza (dopisane do `FORM_TEXT_FIELDS`, więc snapshot, `setField`, `setFormPath` i `isBlank` obsługują je same), a `bannerShowEvent` flagą jak `fillAgenda`. Każdy z 10 banerów rysuje duży tekst przez `PosterText` z `CLUB_NAME[lang]` jako wartością zastępczą, a pod nim nowy blok `BannerEventLine` (wspólny, w `banners/common.tsx`). Formularz banera dostaje pole tekstu, przełącznik i — po włączeniu — pola daty, godziny i miejsca bez ikony oka.

**Tech Stack:** React 19 + TypeScript, Vitest (`renderToStaticMarkup`), Tailwind w formularzach.

**Spec:** `docs/superpowers/specs/2026-11-03-tekst-na-banerze-design.md`

## Global Constraints

- Puste `bannerTitle` = baner pokazuje `CLUB_NAME[lang]`, dokładnie jak dziś.
- `bannerShowEvent` domyślnie `false`; ikona oka (`visibility`) nie wpływa na baner.
- Na banerze puste pole daty/godziny/miejsca nie pokazuje się wcale — bez wartości przykładowych (`PLACEHOLDERS`).
- Separator części linii: `' · '`.
- Format daty jak w linii informacji plakatów: `` `${getDay(date)} ${getMonthShort(date, { lang })}` `` (np. „27 lis”).
- Tekst mieści się w bezpiecznej kolumnie `BANNER_SAFE_W` (1096 px).
- Bez zmian w formularzu baner wygląda jak dziś: migawki HTML banerów dla pustych danych bez zmian.
- Plakaty (tryb „Social media i druk”) bez zmian.

## Review Focus

1. Stary zapis (snapshot bez `bannerTitle`/`bannerShowEvent`) → baner jak dziś, formularz bez błędów (Task 1, test obiegu snapshotu).
2. `bannerTitle` z samymi znacznikami formatu (bez tekstu) → baner pokazuje nazwę koła, nie pusty blok (Task 3, test).
3. Przełącznik włączony, ale wszystkie trzy pola puste → brak linii i brak pustego elementu zajmującego miejsce (Task 2, test).
4. Język EN → wartość zastępcza to angielska nazwa koła, data po angielsku (Task 2 i 3, testy).
5. Ukryte okiem pole `location` na plakacie → na banerze nadal widoczne przy włączonym przełączniku (Task 2, test).

---

### Task 1: Model danych

**Files:**
- Modify: `src/types.ts` (`FORM_TEXT_FIELDS`, `FormValues`)
- Modify: `src/editor/formState.ts` (`EMPTY_FORM`, nowy setter)
- Modify: `src/snapshot/snapshot.ts` (`parseForm`)
- Modify: `src/posters/fallback.ts` (`withPlaceholders`)
- Test: `src/snapshot/snapshot.test.ts`, `src/posters/blocks/PosterText.test.ts` (testy `setFormPath`), `src/utils/issueUrl.test.ts` (obiekt formularza)

**Interfaces:**
- Produces: `FormValues.bannerTitle: string` (element `FORM_TEXT_FIELDS`, dopisany na końcu), `FormValues.bannerShowEvent: boolean`, `setBannerShowEvent(show: boolean): FormUpdate`, `withPlaceholders(data).bannerShowEvent: boolean`.

- [ ] **Step 1: Testy** — w `snapshot.test.ts`: pełny formularz testowy dostaje `bannerTitle: 'Baner'` i `bannerShowEvent: true` (obieg zachowuje obie wartości); stary zapis bez tych kluczy daje `''` i `false`; `isBlank` z samym `bannerTitle: 'x'` → `false`. W `PosterText.test.ts`: `setFormPath('bannerTitle', 'Gala 25')(EMPTY_FORM).bannerTitle === 'Gala 25'`.
- [ ] **Step 2: Uruchom** `npx vitest run src/snapshot src/posters/blocks/PosterText.test.ts` — oczekiwane: FAIL (błędy typów/wartości).
- [ ] **Step 3: Implementacja** — `'bannerTitle'` na końcu `FORM_TEXT_FIELDS`; `bannerShowEvent` w `FormValues` (komentarz w stylu `fillAgenda`), `EMPTY_FORM` (`''`/`false`), `parseForm` (`flagOr`), `withPlaceholders` (`data.bannerShowEvent ?? false`), setter obok `setFillAgenda`. Uzupełnij obiekt formularza w `issueUrl.test.ts`.
- [ ] **Step 4: Uruchom** `npx vitest run && npm run typecheck` — PASS (migawki plakatów bez zmian).
- [ ] **Step 5: Commit** `feat(banery): pola bannerTitle i bannerShowEvent w formularzu i snapshocie`

### Task 2: Blok `BannerEventLine`

**Files:**
- Modify: `src/posters/banners/common.tsx`
- Test: `src/posters/banners/eventLine.test.ts` (nowy)

**Interfaces:**
- Consumes: Task 1 (`bannerShowEvent`).
- Produces: `BannerEventLine({ data, lang, style }: { data: RawPosterData; lang: PosterLang; style?: CSSProperties }): ReactElement | null`.

Zachowanie: gdy `!data.bannerShowEvent` → `null`. Części w kolejności: data (z `event_date`, format z Global Constraints), godzina (`event_time`), miejsce — `PosterText` (`path="location"`, `as="span"`, `inline`, `label="Lokalizacja"`, bez `fallback`). Puste części (miejsce: `toPlain(...) === ''`) pomijane; brak części → `null`. Kontener: `typography.body` z `fontSize` i `lineHeight` skalowanymi przez `textScale` (`leading`), potem `style`. `visibility` ignorowane.

- [ ] **Step 1: Testy** (`renderToStaticMarkup`):
  - przełącznik wyłączony + wszystkie pola → `''`;
  - włączony, `event_date: '2026-11-27'`, `event_time: '15:00'`, `location: 'Działownia'` → zawiera `27 lis · 15:00 · Działownia` (tekst bez znaczników: porównuj po usunięciu tagów);
  - włączony, tylko `location` → zawiera `Działownia`, nie zawiera `·`;
  - włączony, pola puste → `''`;
  - `lang: 'en'`, data `2026-11-27` → zawiera `27 Nov` (dokładny skrót z `getMonthShort` dla EN);
  - `visibility: { location: false }` → miejsce nadal jest.
- [ ] **Step 2: Uruchom** `npx vitest run src/posters/banners/eventLine.test.ts` — FAIL.
- [ ] **Step 3: Implementacja** w `common.tsx`.
- [ ] **Step 4: Uruchom** ten test — PASS.
- [ ] **Step 5: Commit** `feat(banery): linia z datą, godziną i miejscem`

### Task 3: Dziesięć układów banerów

**Files:**
- Modify: `src/posters/banners/Banner{Wyklad,Warsztat,WarsztatBezZdjecia,Konferencja,Rekrutacja,Data,Gosc,Gala,Ogloszenie,Komunikat}.tsx`
- Test: `src/posters/banners/banners.test.ts`

**Interfaces:**
- Consumes: Task 1, Task 2 (`BannerEventLine`), `PosterText` (`src/posters/blocks/PosterText.tsx`).

W każdym banerze element z `{CLUB_NAME[lang]}` zamienia się w `PosterText` z `path="bannerTitle"`, `value={raw.bannerTitle}`, `fallback={CLUB_NAME[lang]}`, `multiline`, `label="Tekst banera"` i **tym samym `style`**, który miał ten element. `raw` z `withPlaceholders`. Bezpośrednio pod nim (ten sam kontener) `<BannerEventLine data={data} lang={lang} />`; w układzie, w którym tytuł nie jest w kontenerze kolumnowym, owinąć oba w kolumnę z odstępem jak w danym układzie.

- [ ] **Step 1: Testy** w `banners.test.ts`:
  - zmień „baner niesie nazwę koła (PL/EN), a nie dane wydarzenia”: bez `bannerTitle` i z `bannerShowEvent: false` — nadal nazwa koła i żadnych danych wydarzenia (dotychczasowe asercje);
  - nowy: `bannerTitle: 'GALA_25'` → każdy baner zawiera `GALA_25` i nie zawiera `CLUB_NAME.pl`;
  - nowy: `bannerTitle` z samymi znacznikami (`''`) → nazwa koła;
  - nowy: `bannerShowEvent: true` + `event_date`, `event_time`, `location: 'SALA_Y'` → każdy baner zawiera `SALA_Y` i `15:00`;
  - `lang: 'en'` bez `bannerTitle` → angielska nazwa koła;
  - zaktualizuj „w edytorze baner nie ma pól edytowalnych na płótnie”: teraz dokładnie jedno pole (`aria-label="Tekst banera"`), a z włączonym przełącznikiem i miejscem — dwa;
  - test „sformatowane pola nie zmieniają banera”: sformatowany `bannerTitle` rysuje formatowanie i nie wycieka znaków `–`.
- [ ] **Step 2: Uruchom** `npx vitest run src/posters/banners` — FAIL.
- [ ] **Step 3: Implementacja** we wszystkich 10 plikach.
- [ ] **Step 4: Uruchom** `npx vitest run src/posters/banners` — PASS, a migawki „puste dane” / „tytuł z <&” / „wszystkie pola” **bez aktualizacji** (`FULL` nie ma `bannerShowEvent`). Jeśli migawka się zmienia, to błąd — wygląd musi zostać.
- [ ] **Step 5: Commit** `feat(banery): edytowalny duży tekst i linia wydarzenia we wszystkich układach`

### Task 4: Formularz banera i nazwa pliku

**Files:**
- Modify: `src/forms/FormBanner.tsx`, `src/forms/FormField.tsx`, `src/App.tsx` (wywołanie `exporter.download`)
- Test: `src/forms/EditorPanels.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `FormField` z opcjonalnym `visibilityToggle?: boolean` (domyślnie `true`; `false` = bez ikony oka).

`FormBanner`: znika akapit `UI_HINT` o polach wydarzenia. Nowa grupa „Tekst” na górze: `FormField` dla `{ name: 'bannerTitle', label: 'Tekst banera', type: 'textarea', rows: 2, placeholder: CLUB_NAME[lang] }` bez oka (`lang` nowym propsem: `EditorPage` → `ContentPanel` (`EditorPanelProps.lang?: PosterLang`) → `FormBanner`; brak = `pl`), checkbox „Pokaż datę i miejsce” (styl jak „Dopasuj program” w `FormKonferencja`), a gdy zaznaczony — `FIELDS.date`, `FIELDS.time`, `FIELDS.location` bez oka. Potem dotychczasowe Zdjęcia i Kod QR.

Nazwa pliku: w `App.tsx` przy pobieraniu banera z niepustym `toPlain(form.bannerTitle)` podstawą nazwy jest ten tekst; w pozostałych przypadkach jak dziś `toPlain(form.title)`.

- [ ] **Step 1: Testy** w `EditorPanels.test.ts` (render panelu „Treść” w trybie baner): jest pole „Tekst banera”; brak tekstu „dotyczą tylko trybu”; bez przełącznika brak pól „Data”/„Lokalizacja”; z `bannerShowEvent: true` są, i bez przycisku „Pokaż na plakacie”.
- [ ] **Step 2: Uruchom** `npx vitest run src/forms` — FAIL.
- [ ] **Step 3: Implementacja.**
- [ ] **Step 4: Uruchom** `npx vitest run && npm run typecheck && npm run lint` — PASS.
- [ ] **Step 5: Commit** `feat(banery): formularz tekstu banera i daty; nazwa pliku z tekstu banera`

### Task 5: Sprawdzenie w przeglądarce i dokumentacja

**Files:**
- Modify: `docs/architektura.md` lub `docs/dodawanie-szablonu.md` — tam, gdzie opisane jest, że baner niesie stałą nazwę koła (znajdź `grep -rn "nazw" docs/*.md`), dopisz `bannerTitle`/`BannerEventLine`.

- [ ] **Step 1:** `npm run dev`, tryb „Baner”: każdy z 10 układów w obu formatach (okładka strony 1640×624, wydarzenia 1920×1005) z długim tekstem banera (2 linie) i włączoną linią wydarzenia. Nic nie wychodzi poza kadr ani na logotypy; tam, gdzie ciasno (np. Gala na okładce strony), zmniejsz odstępy w układzie.
- [ ] **Step 2:** Edycja na podglądzie: pole tekstu banera i miejsca, pasek formatowania, formularz pokazuje czysty tekst.
- [ ] **Step 3:** Dokumentacja.
- [ ] **Step 4:** `npx vitest run && npm run typecheck && npm run lint` — PASS.
- [ ] **Step 5: Commit** `docs: tekst na banerach` (oraz ewentualne poprawki odstępów jako osobny commit `fix(banery): odstępy przy linii wydarzenia`).
