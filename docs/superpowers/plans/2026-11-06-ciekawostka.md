# Ciekawostka („Czy wiesz, że…?") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nowy szablon plakatu `ciekawostka` z trzema układami (zdjęcie u góry / panorama / archiwum), złotym akcentem, stopką z logo i prawdziwym wysokim układem Story 1080×1920.

**Architecture:** Nowy `PosterShape` `'story'` włączany flagą `storyShape` w rejestrze — `shapeFor` zwraca go dla formatu Story tylko dla layoutów z flagą; eksport rasteryzuje taki węzeł wprost 1080×1920. Szablon to jeden komponent `PosterCiekawostka` przełączający trzy układy wg pola formularza `ciekawostkaLayout`; opis mieści się dzięki `PosterAutoFit` (wspólny z slajdami algorytm `findFitFactor`), który zgłasza przepełnienie przez `PosterEdit.onNotice`.

**Tech Stack:** React 19 + TypeScript, style inline + zmienne CSS ze `schemes.ts`, vitest + `react-dom/server` (`renderToStaticMarkup`), html-to-image.

**Spec:** `docs/superpowers/specs/2026-11-06-ciekawostka-design.md` (czytaj razem z tym planem). Mockup układów: `.superpowers/brainstorm-mockup/layout.html` (lokalnie, poza gitem).

## Global Constraints

- Postępuj wg `docs/dodawanie-szablonu.md` i `docs/stylowanie.md`: style inline + `var(--rola)`; żadnego Tailwinda w plakatach; bloki z `src/posters/blocks/`.
- Każda rola CSS użyta przez plakat musi istnieć w bloku `default` layoutu `ciekawostka` w `schemes.ts`.
- Schemat z osią akcentu: `recipe(defaultAccent, blok)` musi dawać dokładnie to, co blok już ma (komentarz nad `AccentRecipe` w `schemes.ts`).
- Teksty wbudowane dwujęzycznie w `src/posters/copy.ts`, wybierane `[lang]`. Etykieta domyślna: `CZY WIESZ, ŻE…` / `DID YOU KNOW…`.
- Tekst z formularza zawsze przez `PosterText` (edycja na podglądzie), ukrywanie pól przez `fx`/`hidden` z `withPlaceholders`.
- Globalny `colors.gold` (`#84754E`) i `ACCENT_DOT.zloty` bez zmian. Nowy token `colors.goldBright = '#C9A961'`.
- Inne layouty: format Story działa jak dotychczas (kwadrat + dostawka tła); żadnych zmian w ich wyglądzie (istniejące testy/snapshoty przechodzą bez aktualizacji).
- Story 1080×1920: tekst, sygnet, logo i QR poza górnymi 250 px i dolnymi 340 px.
- Zdjęcie bez filtrów (bez sepii). Kadr zdjęcia (`photos.photo`) wspólny dla wszystkich układów.
- Kwadrat i Story mają stałą wysokość (bez `PosterFrame grow`).
- Komentarze w kodzie po polsku, jak w reszcie repo.
- Po każdym tasku: `npm run typecheck && npm test && npm run lint` zielone.

## Review Focus

1. **Brak zdjęcia** — wszystkie układy (A/B/C × kwadrat/Story) pokazują zakreskowany placeholder z podpisem i wymiarem, nic się nie rozjeżdża (test w Task 5 i 6).
2. **Pusty formularz** (miniatura szablonu, `data: {}`) — plakat pokazuje przykładowe teksty (`PLACEHOLDERS`/`DEFAULT_BADGE`), w układzie C bez roku nie zostaje puste miejsce (test w Task 6).
3. **Długi opis + suwak „Rozmiar tekstu" na max** — opis się zmniejsza, przy minimum ostrzeżenie w edytorze, eksport nie nachodzi na stopkę (test `findFitFactor` w Task 4; ręczna weryfikacja w Task 7).
4. **Ukryte pola** (oko w formularzu dla `badge`, `title`, `body`, `badge2`) — pole znika, układ się domyka (test w Task 5).
5. **Język EN** — etykieta `DID YOU KNOW…`, adres w stopce bez zmian (test w Task 5).

---

### Task 1: Kształt `story` i wysokie Story dla layoutów z flagą

**Files:**
- Modify: `src/types.ts` (`PosterShape`, `RegistryEntry`)
- Modify: `src/posters/shape.ts` (`SHAPE_SIZE`)
- Modify: `src/posters/formats.ts` (`shapeFor`)
- Modify: `src/posters/export.ts` (`DownloadOptions`, `downloadPoster`)
- Modify: `src/editor/usePosterExport.ts`, `src/App.tsx:61`, `src/components/SnapshotThumb.tsx:24`
- Test: `src/posters/formats.test.ts`, `src/components/SnapshotThumb.test.ts`

**Interfaces:**
- Produces:
  - `PosterShape = 'square' | 'portrait' | 'landscape' | 'cover' | 'event' | 'story'`
  - `SHAPE_SIZE.story = { width: 1080, height: 1920 }`
  - `RegistryEntry.storyShape?: boolean` — „layout ma własny wysoki układ Story"
  - `shapeFor(formatKey: string, orientation: Orientation, tallStory = false): PosterShape` — `'story'` tylko dla `formatKey === 'story' && tallStory`
  - `usePosterExport(tallStory = false)` — zwracane `shape` liczone z `tallStory`
  - `DownloadOptions.shape?: PosterShape` — gdy `'story'`, `downloadPoster` rasteryzuje węzeł funkcją `rasterise(node, 'story', format)` i zapisuje PNG (jak `downloadBanner`), bez `compositeOnCanvas`.

- [ ] **Step 1: Write the failing tests** (w `formats.test.ts`)

```ts
it('story: wysoki kształt tylko dla layoutów z własnym układem Story', () => {
  expect(shapeFor('story', 'portrait')).toBe('square')
  expect(shapeFor('story', 'portrait', true)).toBe('story')
  expect(shapeFor('square', 'portrait', true)).toBe('square')
  expect(shapeFor('a4', 'landscape', true)).toBe('landscape')
  expect(SHAPE_SIZE.story).toEqual({ width: EXPORT_FORMATS.story.width, height: EXPORT_FORMATS.story.height })
})
```

- [ ] **Step 2: Run** `npx vitest run src/posters/formats.test.ts` — Expected: FAIL (`SHAPE_SIZE.story` undefined / `'square'` zamiast `'story'`).

- [ ] **Step 3: Implement** typy, `SHAPE_SIZE.story`, `shapeFor` (trzeci parametr), `usePosterExport(tallStory)` (przekazuje `shape` do `downloadPoster` w opcjach), w `App.tsx` `usePosterExport(Boolean(editor.template && posterRegistry[editor.template.poster_key]?.storyShape))`, w `SnapshotThumb` `shapeFor(format, orientation, Boolean(poster.storyShape))`. `downloadPoster`: przed gałęzią social — `if (opts.shape === 'story') { await downloadBanner(node, basename, 'story', format); return {} }` (zmień nazwę/komentarz `downloadBanner` na ogólniejszy, np. `downloadFixed`, jeśli czytelniej).

- [ ] **Step 4: Run** `npm run typecheck && npm test` — Expected: PASS (istniejące testy `SnapshotThumb`/`shellParts`/`EditorPage` wołają `usePosterExport()` bez argumentu i muszą przechodzić bez zmian).

- [ ] **Step 5: Commit** `feat(eksport): wysoki kształt story dla layoutów z własnym układem Story`

---

### Task 2: Pola formularza `year` i `ciekawostkaLayout`

**Files:**
- Modify: `src/types.ts` (`FORM_TEXT_FIELDS`, `FormValues`)
- Modify: `src/editor/formState.ts` (`EMPTY_FORM`, setter)
- Modify: `src/snapshot/snapshot.ts` (`parseForm`)
- Test: `src/snapshot/snapshot.test.ts`, `src/editor/formState.test.ts` (jeśli istnieje; inaczej w snapshot.test)

**Interfaces:**
- Produces:
  - `'year'` dopisane na końcu `FORM_TEXT_FIELDS` (przed `bannerTitle` albo po — kolejność bez znaczenia dla danych, dopisz po `body`)
  - `export type CiekawostkaLayout = 'zdjecie' | 'panorama' | 'archiwum'` (w `types.ts`)
  - `FormValues.ciekawostkaLayout: CiekawostkaLayout`, `EMPTY_FORM.ciekawostkaLayout = 'zdjecie'`, `EMPTY_FORM.year = ''`
  - `setCiekawostkaLayout(layout: CiekawostkaLayout): FormUpdate` w `formState.ts`
  - `parseForm`: `year: text('year')`, `ciekawostkaLayout`: wartość spoza trzech → `'zdjecie'`

- [ ] **Step 1: Write the failing tests** (snapshot.test.ts)

```ts
it('ciekawostka: układ i rok przechodzą przez snapshot, nieznany układ → zdjecie', () => {
  // obieg: forma z { year: '2001', ciekawostkaLayout: 'archiwum' } → snapshot → parse daje te same wartości
  // parse surowego { ciekawostkaLayout: 'foo' } daje 'zdjecie'; brak pola → 'zdjecie', year → ''
})
```
Użyj istniejących helperów obiegu w tym pliku (np. `withForm`), asercje: `toBe('2001')`, `toBe('archiwum')`, `toBe('zdjecie')`.

- [ ] **Step 2: Run** `npx vitest run src/snapshot` — Expected: FAIL.
- [ ] **Step 3: Implement** wg Interfaces.
- [ ] **Step 4: Run** `npm run typecheck && npm test` — Expected: PASS (istniejący test „każde pole tekstowe nie jest puste" w snapshot.test obejmie `year` sam).
- [ ] **Step 5: Commit** `feat(formularz): pola year i ciekawostkaLayout`

---

### Task 3: Kolory — `goldBright`, schematy i recepta `ciekawostka`, teksty

**Files:**
- Modify: `src/posters/theme.ts` (`colors.goldBright`)
- Modify: `src/posters/schemes.ts` (blok `ciekawostka`, `accentRecipes.ciekawostka`, mapa `schemes`)
- Modify: `src/posters/copy.ts` (`DEFAULT_BADGE.ciekawostka`)
- Test: `src/posters/schemes.test.ts`

**Interfaces:**
- Produces:
  - `colors.goldBright = '#C9A961'`
  - `DEFAULT_BADGE.ciekawostka = { pl: 'CZY WIESZ, ŻE…', en: 'DID YOU KNOW…' }`
  - `schemesFor('ciekawostka')` → `['okazjonalny', 'default', 'czern', 'szary']` (pierwszy = domyślny w edytorze, patrz `fitColorsToLayout`)
  - Role używane przez plakat (wszystkie w `default`): `pageBg`, `pageText`, `mutedText`, `accent`, `panel` (tło „odbitki"/pasów, np. `inkPanel` na ciemnym), `sygnet`, `logoVariant`.
  - Bloki:
    - `default`: krem (`colors.cream`), tekst `colors.ink`, `mutedText: colors.textMuted`, `accent: colors.navy`, sygnet `'granat'`, logo `'light'`, `accents: ['granatowy', 'pomaranczowy']`, `defaultAccent: 'granatowy'`
    - `okazjonalny`: `pageBg: colors.ink`, `pageText: colors.goldPanelText`, `mutedText: colors.creamMuted`, `panel: colors.inkPanel`, logo `'dark'`, `accents: ['zloty', 'srebrny']`, `defaultAccent: 'zloty'`
    - `czern`: `pageBg: colors.black`, `pageText: colors.cream`, `mutedText: colors.creamMuted`, sygnet `'negatywny'`, logo `'dark'`, `accents: 'all'`, `defaultAccent: 'zloty'`
    - `szary`: `pageBg: colors.paper`, `pageText: colors.slate`, `accent: colors.grayDark`, sygnet `'szary'`, logo `'light'`, bez `accents`
  - Recepta: `accent` = `goldBright` dla `zloty` na ciemnym tle (`isDarkBg(ctx.pageBg)`), w pozostałych przypadkach `accentColor(accent, ctx)`; dla metalu `sygnet` = wariant metalu (`accentSygnet`) i `sygnetBg` = ciemne tło strony (jak recepta `gosc` — złoty sygnet nie może leżeć na złotym trójkącie); dla nie-metali `sygnetBg` nie jest ustawiane (komponent spada do `var(--accent)`). Złoto na jasnym tle nie występuje (osie to wykluczają).

- [ ] **Step 1: Write the failing tests**

```ts
describe('Ciekawostka', () => {
  it('schematy i domyślny pierwszy', () => {
    expect(schemesFor('ciekawostka')).toEqual(['okazjonalny', 'default', 'czern', 'szary'])
  })
  it('złoto na ciemnym tle jest jaśniejsze niż globalne', () => {
    expect(resolveScheme('ciekawostka', 'okazjonalny').cssVars['--accent']).toBe(colors.goldBright)
    expect(resolveScheme('ciekawostka', 'czern').cssVars['--accent']).toBe(colors.goldBright)
    expect(resolveScheme('ciekawostka', 'okazjonalny').sygnet).toBe('zloty')
    expect(resolveScheme('ciekawostka', 'okazjonalny', 'srebrny').cssVars['--accent']).toBe(colors.silver)
    expect(colors.gold).toBe('#84754E')
  })
  it('osie akcentu', () => {
    expect(accentsFor('ciekawostka', 'okazjonalny')).toEqual(['zloty', 'srebrny'])
    expect(accentsFor('ciekawostka', 'default')).toEqual(['granatowy', 'pomaranczowy'])
    expect(accentsFor('ciekawostka', 'szary')).toEqual([])
    expect(defaultAccentFor('ciekawostka', 'czern')).toBe('zloty')
  })
  it('każda rola użyta w plakacie jest w bloku default', () => {
    const vars = resolveScheme('ciekawostka', 'default').cssVars
    for (const v of ['--page-bg', '--page-text', '--muted-text', '--accent', '--panel']) expect(vars[v as `--${string}`], v).toBeDefined()
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/posters/schemes.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** wg Interfaces. Sprawdź warunek „Domyślny nie zmienia wyglądu" (blok z osią: wpisane w nim `accent`/`sygnet` = wynik recepty dla `defaultAccent`). Dodaj `ciekawostka` do istniejących pętli w testach „Okazjonalny … obecny na N layoutach" tylko jeśli test to iteruje po liście — nie zmieniaj ich asercji.
- [ ] **Step 4: Run** `npm run typecheck && npm test` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(kolory): schematy Ciekawostki i jaśniejsze złoto na ciemnym tle`

---

### Task 4: `PosterAutoFit` — dopasowanie fontu opisu w plakacie

**Files:**
- Create: `src/utils/fitFactor.ts` (przeniesione `findFitFactor` + `contentOverflows` z `src/slides/komponenty/_tekst.tsx`; `_tekst.tsx` importuje je stąd i dalej je re-eksportuje, jeśli coś je importuje z `_tekst`)
- Create: `src/posters/blocks/PosterAutoFit.tsx`
- Test: `src/utils/fitFactor.test.ts` (przenieś istniejące testy `findFitFactor`, jeśli są w slajdach; inaczej nowe)

**Interfaces:**
- Produces:
  - `findFitFactor(overflowsAt: (f: number) => boolean, min = 0.7, iterations = 7): { factor: number; overflowing: boolean }` (bez zmian sygnatury)
  - `contentOverflows(el: HTMLElement): boolean`
  - `posterFit(px: number): string` → `` `calc(${px}px * var(--fit, 1))` `` (w `PosterAutoFit.tsx`)
  - `<PosterAutoFit min={number} notice={string} style={CSSProperties}>{children}</PosterAutoFit>` — pudełko `position: relative`, ograniczona wysokość z `style` (np. `flex: 1, minHeight: 0`); mierzy w `useLayoutEffect` i przy zmianie rozmiaru (`ResizeObserver`, jak `AutoFit` w slajdach), ustawia `--fit` bezpośrednio w `style` elementu (bez stanu Reacta — eksport z html-to-image widzi wartość), przy `overflowing` woła `usePosterEdit().onNotice?.(notice)`, inaczej `onNotice?.(null)`; przy odmontowaniu `onNotice?.(null)`. Overflow ukryty (`overflow: hidden`), żeby tekst nie wszedł na stopkę.

- [ ] **Step 1: Write the failing tests** (fitFactor.test.ts)

```ts
it('mieści się od razu → 1', () => expect(findFitFactor(() => false)).toEqual({ factor: 1, overflowing: false }))
it('nie mieści się nawet przy min → min + overflowing', () => expect(findFitFactor(() => true, 0.6)).toEqual({ factor: 0.6, overflowing: true }))
it('znajduje największy mnożnik ≤ progu', () => {
  const r = findFitFactor((f) => f > 0.8, 0.5)
  expect(r.overflowing).toBe(false)
  expect(r.factor).toBeLessThanOrEqual(0.8)
  expect(r.factor).toBeGreaterThan(0.78)
})
```

- [ ] **Step 2: Run** `npx vitest run src/utils/fitFactor.test.ts` — Expected: FAIL (brak modułu).
- [ ] **Step 3: Implement** przeniesienie + `PosterAutoFit`. Slajdy mają działać jak dotąd (zmienia się tylko miejsce funkcji).
- [ ] **Step 4: Run** `npm run typecheck && npm test` — Expected: PASS (testy slajdów bez zmian).
- [ ] **Step 5: Commit** `feat(plakaty): PosterAutoFit - opis sam się zmniejsza, gdy się nie mieści`

---

### Task 5: Szablon `ciekawostka` — układ A (Zdjęcie u góry), formularz, rejestr

**Files:**
- Create: `src/posters/PosterCiekawostka.tsx`
- Create: `src/forms/FormCiekawostka.tsx`
- Create: `src/posters/banners/BannerCiekawostka.tsx` (na razie minimalny — patrz Task 6, tu wystarczy, żeby przechodził `banners.test.ts`)
- Modify: `src/posters/registry.ts`, `src/db/schema.ts` (`DEFAULT_TEMPLATES`: `{ name: 'Ciekawostka', poster_key: 'ciekawostka' }`)
- Test: `src/posters/ciekawostka.test.ts`

**Interfaces:**
- Consumes: Task 1 (`storyShape`, `usePosterShape().shape === 'story'`), Task 2 (`raw.year`, `data.ciekawostkaLayout`, `setCiekawostkaLayout`), Task 3 (`resolveScheme('ciekawostka', …)`, `DEFAULT_BADGE.ciekawostka`), Task 4 (`PosterAutoFit`, `posterFit`).
- Produces:
  - `PosterCiekawostka({ data, scheme, accent, lang }: PosterProps)` — wybiera układ `data.ciekawostkaLayout ?? 'zdjecie'`; każdy układ to osobna funkcja w tym pliku (`LayoutZdjecie`, `LayoutPanorama`, `LayoutArchiwum`) dostająca wspólne, już przygotowane elementy (etykieta, tytuł, opis, stopka, zdjęcie), żeby nie powielać pól.
  - Wpis rejestru: `ciekawostka: { name: 'Ciekawostka', Component: PosterCiekawostka, Banner: BannerCiekawostka, bannerPhoto: true, storyShape: true, Form: FormCiekawostka }`
  - `PLACEHOLDERS.ciekawostkaTitle = 'SKNM powstało z inicjatywy studentów?'` i `PLACEHOLDERS.ciekawostkaBody` = przykład ze specu (tekst w `fallback.ts`), używane jako `fallback` tytułu i opisu w tym szablonie.

Pola (`FormCiekawostka`, przez `PosterForm`, `photoLabel="Zdjęcie"`):
`badgeField(DEFAULT_BADGE.ciekawostka.pl)`, `FIELDS.title` (placeholder: `PLACEHOLDERS.ciekawostkaTitle`), `{ name: 'body', label: 'Opis', type: 'textarea', rows: 6, placeholder: PLACEHOLDERS.ciekawostkaBody }`, `{ name: 'year', label: 'Rok (układ „Archiwum")', placeholder: '2001' }`, `{ name: 'badge2', label: 'Linia na dole', placeholder: SITE_URL }`. Nad polami (jako `children` albo osobna grupa „Układ") trzy przyciski jak w `QrField` (`Button variant="outline"`, `aria-pressed`, `iconEnd="check"`): „Zdjęcie u góry", „Panorama", „Archiwum" → `setCiekawostkaLayout`.

Układ A (wg mockupu A):
- **Kwadrat 1080×1080**: zdjęcie od krawędzi do krawędzi, wysokość ~560 px (`PhotoGallery`, podpis placeholdera `stare zdjęcie grupowe` + `1080 × 560`); sygnet w trójkącie w lewym górnym rogu zdjęcia (jak w `PosterGosc`, `var(--sygnet-bg, var(--accent))`); pod zdjęciem linia 2 px gradientem `transparent → var(--accent) 15% → var(--accent) 85% → transparent`; treść z paddingiem 72 px po bokach: kicker (trójkąt + `Badge`-podobny mono 22 px, `var(--accent)`, pole `badge`), tytuł 64 px × `titleScale` 800, opis w `PosterAutoFit` (`posterFit(28 * textScale)`, `lineHeight: 1.45`, `var(--muted-text)`, min ≈ 0.78), `PosterFooter` (`lead` = `PosterText path="badge2"` fallback `SITE_URL`, mono 20 px, `var(--accent)`).
- **Story 1080×1920**: zdjęcie ~900 px od góry (strefa 0–250 px może być zdjęciem — sygnet przesunięty tak, żeby był poniżej 250 px albo w trójkącie, którego treść zaczyna się od y ≥ 250); tytuł 80 px, opis `posterFit(34 * textScale)` (min ≈ 0.76); stopka kończy się nad y = 1580 (dolne 340 px tylko tło).
- **Pion/poziom (druk)**: nie projektowane — kwadratowy układ w ramce `PosterFrame` (zdjęcie proporcjonalne do `height`, jak `photoH` w `PosterGosc`); ważne tylko, żeby nic nie wyszło poza kadr.
- Ostrzeżenie `PosterAutoFit`: `'Opis nie mieści się — skróć tekst albo zmniejsz rozmiar tekstu.'`

- [ ] **Step 1: Write the failing tests** (`ciekawostka.test.ts`, `renderToStaticMarkup` jak w `wideSubtitle.test.ts`, kształt przez `PosterScaled` jak w `banners.test.ts`)

```ts
it('pusty formularz: przykładowe teksty i etykieta PL', () => {
  const html = render({}, 'square')
  expect(html).toContain('CZY WIESZ, ŻE…')
  expect(html).toContain('SKNM powstało z inicjatywy studentów?')
  expect(html).toContain('sknm.pk.edu.pl')
})
it('EN: etykieta DID YOU KNOW…', () => expect(render({}, 'square', 'en')).toContain('DID YOU KNOW…'))
it('story: ramka 1080×1920', () => expect(render({}, 'story')).toContain('width:1080px;height:1920px'))
it('ukryty opis znika', () => {
  const html = render({ body: 'OPIS_X', visibility: { body: false } }, 'square')
  // element niosący OPIS_X ma display:none (wzór asercji: istniejące testy widoczności, `git grep -n "visibility" -- '*.test.ts'`)
})
it('rejestr: storyShape i szablon domyślny', () => {
  expect(posterRegistry.ciekawostka.storyShape).toBe(true)
  expect(DEFAULT_TEMPLATES.some((t) => t.poster_key === 'ciekawostka')).toBe(true)
})
```

- [ ] **Step 2: Run** `npx vitest run src/posters/ciekawostka.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** komponent (tylko układ A; B i C na razie renderują A), formularz, minimalny baner (CLUB_NAME, `PosterText path="bannerTitle"` — wymagania `banners.test.ts`), rejestr, `DEFAULT_TEMPLATES`.
- [ ] **Step 4: Run** `npm run typecheck && npm test && npm run lint` — Expected: PASS (w tym pętle po rejestrze w `banners.test.ts`, `richFields.test.ts`, `lineBreaks.test.ts`, `qrSide.test.ts`).
- [ ] **Step 5: Commit** `feat(ciekawostka): nowy szablon - układ „Zdjęcie u góry", kwadrat i Story`

---

### Task 6: Układy B (Panorama) i C (Archiwum) + baner

**Files:**
- Modify: `src/posters/PosterCiekawostka.tsx`, `src/posters/banners/BannerCiekawostka.tsx`
- Test: `src/posters/ciekawostka.test.ts`

**Interfaces:**
- Consumes: Task 5 (`LayoutPanorama`, `LayoutArchiwum` w tym samym pliku, wspólne elementy).

Układ B (mockup B): padding 72; nagłówek: kicker po lewej, sygnet po prawej; tytuł 76 px × `titleScale`; pas zdjęcia od krawędzi do krawędzi, wysokość 210 px w kwadracie (placeholder `panorama · 1080 × 210`), 380 px w Story; opis `posterFit(30 * textScale)` w `PosterAutoFit` wypełniający resztę (`flex: 1`); stopka. Story: ta sama kolejność, większe rozmiary, strefy bezpieczne.

Układ C (mockup C): kicker; wiersz: „odbitka" (zdjęcie ~440×330 w kwadracie, `outline: 14px solid var(--page-text)` albo `var(--panel)`-ramka — tak, żeby ramka była jasna na ciemnym i ciemna na jasnym tle; `transform: rotate(-2deg)`) + tytuł obok; pod spodem opis `PosterAutoFit`; rok (`raw.year`) — tylko gdy `toPlain(raw.year ?? '') !== ''` albo w edycji (`editable`, wtedy z podpowiedzią „Rok"): `PosterText path="year"`, 380 px w kwadracie / 520 px w Story, 800, `var(--accent)`, `opacity: .14`, `position: absolute` w prawym górnym obszarze, `pointerEvents` tylko w edycji, pod treścią (`zIndex: 0`, treść `zIndex: 1`). Story: odbitka nad tytułem (kolumna), większa (~760×570).

Baner (cover 1640×624 / event 1192×624, `useBannerLayout`): zdjęcie z lewej (pełna wysokość, ~40% szerokości) albo `PhotoGallery` placeholder; po prawej kicker (`badge`), `PosterText path="bannerTitle"` fallback `CLUB_NAME[lang]` (wymóg testów banerów — baner nie niesie danych plakatu), `BannerFooter`. Bez opisu. Wzór: `BannerGosc.tsx`.

- [ ] **Step 1: Write the failing tests**

```ts
it.each(['zdjecie', 'panorama', 'archiwum'] as const)('%s: kwadrat i Story renderują się na pustych danych z placeholderem zdjęcia', (layout) => {
  for (const shape of ['square', 'story'] as const) {
    const html = render({ ciekawostkaLayout: layout }, shape)
    expect(html).toContain('CZY WIESZ, ŻE…')
    expect(html.toLowerCase()).toContain(layout === 'panorama' ? 'panorama' : 'zdjęcie')
  }
})
it('archiwum: rok widoczny tylko, gdy wpisany (poza edycją)', () => {
  expect(render({ ciekawostkaLayout: 'archiwum', year: '2001' }, 'square')).toContain('2001')
  expect(render({ ciekawostkaLayout: 'archiwum' }, 'square')).not.toContain('2001')
  expect(render({ ciekawostkaLayout: 'zdjecie', year: '2001' }, 'square')).not.toContain('2001')
})
it('układy różnią się markupem', () => {
  const a = render({ ciekawostkaLayout: 'zdjecie' }, 'square')
  expect(render({ ciekawostkaLayout: 'panorama' }, 'square')).not.toBe(a)
  expect(render({ ciekawostkaLayout: 'archiwum' }, 'square')).not.toBe(a)
})
```

- [ ] **Step 2: Run** `npx vitest run src/posters/ciekawostka.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** układy B, C i baner.
- [ ] **Step 4: Run** `npm run typecheck && npm test && npm run lint` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ciekawostka): układy „Panorama" i „Archiwum" oraz baner`

---

### Task 7: Dokumentacja, `.gitignore` i weryfikacja w przeglądarce

**Files:**
- Modify: `.gitignore` (dopisz `.superpowers/`)
- Modify: `docs/dodawanie-szablonu.md` (krótka sekcja: flaga `storyShape` + kształt `story`, strefy bezpieczne 250/340 px; `PosterAutoFit` dla długiego tekstu)

- [ ] **Step 1:** Dopisz dokumentację i `.gitignore`.
- [ ] **Step 2: Weryfikacja ręczna** (`npm run dev`, skill `run` albo Claude in Chrome): wybierz „Ciekawostka"; dla każdego układu A/B/C × format Kwadrat/Story × schemat Okazjonalny/Granat/Czerń/Szary sprawdź: podgląd Story jest wysoki; wklej przykład ze specu → mieści się bez ostrzeżenia przy domyślnym rozmiarze; wklej 3× przykład → opis maleje, potem pojawia się ostrzeżenie, tekst nie wchodzi na stopkę; suwak „Rozmiar tekstu" na max; pobierz PNG kwadrat i Story → plik 1080×1080 / 1080×1920 wygląda jak podgląd; inny szablon (np. Gość) w formacie Story → nadal kwadrat z dostawką.
- [ ] **Step 3: Run** `npm run build && npm test && npm run lint` — Expected: PASS.
- [ ] **Step 4: Commit** `docs(ciekawostka): wysoki Story i dopasowanie opisu w instrukcji szablonu`
