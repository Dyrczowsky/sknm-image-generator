# Hurtowy upload grafik do stopki plakatu

## Cel

Zamiast dwóch keyed slotów na logo (`logos.pk`, `logos.faculty`) — jedna
**lista grafik** na plakat, do której użytkownik wgrywa wiele plików naraz.
Grafiki układają się w `LogoRow` przez flexbox, każda tak jak dziś logo PK
(wysokość `LOGO_HEIGHT`, pole ochronne ¼, gap ¼). Osobny checkbox „Dodaj
logo PK" steruje tym, czy przed listą pojawia się domyślne logo Politechniki.

## Model danych

### `src/types.ts`

`FormValues`:
- **usuń** `logos: Record<string, LogoSlotValue>`
- **dodaj** `graphics: string[]` — data URL-e wgranych grafik, w kolejności wyświetlania
- **dodaj** `showPkLogo: boolean` — czy renderować domyślne logo PK jako pierwszy element

`LogoSlotValue` — zostaje (używa go `LogoSlot`).

`FormProps`:
- **usuń** `onLogoChange`, `onLogoEnabledChange`
- **dodaj**
  - `onGraphicsAdd(srcs: string[]): void` — dokłada na koniec listy (przycina do limitu)
  - `onGraphicRemove(index: number): void`
  - `onGraphicMove(index: number, dir: -1 | 1): void` — zamiana sąsiadów
  - `onShowPkChange(value: boolean): void`

`RawPosterData` — bez zmian (pochodna kluczy `FormValues`; `graphics`/`showPkLogo`
przechodzą automatycznie).

### `src/posters/fallback.ts` — `withPlaceholders`

- **usuń** `logos: data.logos ?? {}`
- **dodaj** `graphics: data.graphics ?? []`
- **dodaj** `showPkLogo: data.showPkLogo ?? true`

### `LIMIT`

`MAX_GRAPHICS = 4` (stała w nowym `GraphicsField` lub w `theme.ts` obok `LOGO_HEIGHT`).
Tyle mieści się w `LogoRow` przy 48px + pole ochronne + gap, zanim zacznie ciasno.
Brak zapisu w draftcie (jak dziś logo/zdjęcia — `saveDraft` i tak zapisuje tylko
pola tekstowe + `visibility` + scheme + template_id).

## `src/App.tsx`

- `EMPTY_FORM`: usuń `logos: {}`, dodaj `graphics: [], showPkLogo: true`
- `getDraft` init: to samo (`graphics: [], showPkLogo: true`)
- `handleRestoreHistoryEntry`: to samo
- **usuń** `handleLogoChange`, `handleLogoEnabledChange`
- **dodaj**:
  ```ts
  const handleGraphicsAdd = (srcs: string[]) => setForm((prev) => {
    const next = { ...prev, graphics: [...prev.graphics, ...srcs].slice(0, MAX_GRAPHICS) }
    persistDraft(next, selectedTemplateId, selectedScheme)
    return next
  })
  const handleGraphicRemove = (index: number) => setForm((prev) => {
    const next = { ...prev, graphics: prev.graphics.filter((_, i) => i !== index) }
    persistDraft(next, selectedTemplateId, selectedScheme)
    return next
  })
  const handleGraphicMove = (index: number, dir: -1 | 1) => setForm((prev) => {
    const j = index + dir
    if (j < 0 || j >= prev.graphics.length) return prev
    const g = [...prev.graphics]
    ;[g[index], g[j]] = [g[j], g[index]]
    const next = { ...prev, graphics: g }
    persistDraft(next, selectedTemplateId, selectedScheme)
    return next
  })
  const handleShowPkChange = (value: boolean) => setForm((prev) => {
    const next = { ...prev, showPkLogo: value }
    persistDraft(next, selectedTemplateId, selectedScheme)
    return next
  })
  ```
- `<SelectedForm ...>` — wymień propsy `onLogoChange`/`onLogoEnabledChange`
  na cztery powyższe.

## Nowy komponent `src/forms/GraphicsField.tsx`

Zastępuje `LogoField` w formularzach. Props: `value: FormValues` + cztery handlery
z `FormProps`.

Zawartość (styl Tailwind jak reszta formularza, w kontenerze
`mt-[18px] flex flex-col gap-2.5 border-t border-border pt-[18px]`):

1. **Checkbox „Dodaj logo PK"** — `checked={value.showPkLogo}` →
   `onShowPkChange(e.target.checked)`. Podpis: „Dodaj logo Politechniki
   Krakowskiej". Hint gdy odznaczony: brak domyślnego logo.
2. **Lista miniatur** `value.graphics`:
   - `<img>` w ramce ~52×52 (jak `.image-upload-preview` z ImageUpload)
   - „Usuń" → `onGraphicRemove(i)`
   - ▲ `onGraphicMove(i, -1)` (disabled dla `i === 0`)
   - ▼ `onGraphicMove(i, 1)` (disabled dla `i === graphics.length - 1`)
3. **Pole dodawania** (gdy `graphics.length < MAX_GRAPHICS`): `<label>` z
   `<input type="file" multiple accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg">`.
   `onChange`: `Promise.all([...files].map(readAsDataUrl))` → `onGraphicsAdd(dataUrls)`;
   `e.target.value = ''` po odczycie. Podpis „Wgraj grafiki (N/4)".

`readAsDataUrl` — wydziel z `ImageUpload.tsx` do `src/utils/readAsDataUrl.ts`
i zaimportuj w obu miejscach (dziś jest lokalny w ImageUpload).

## Plakaty (8×)

W każdym: `<LogoRow>` z ręcznymi `<LogoSlot logo={logos.pk}/>` +
`<LogoSlot logo={logos.faculty} fallback={false}/>` (albo tylko `pk`) →
render z listy.

```tsx
const { ..., graphics, showPkLogo } = withPlaceholders(data)
const slots: (string | null)[] = [...(showPkLogo ? [null] : []), ...graphics]
// null = domyślne logo PK (fallback), string = wgrana grafika
```

W `LogoRow`:
```tsx
{slots.map((src, i) => (
  <LogoSlot
    key={i}
    logo={src ? { src, enabled: true } : undefined}
    fallback={src === null}
    flush={i === slots.length - 1 ? ['r'] : []}   // ostatni przy prawej krawędzi
    style={/* Warsztat: { background: 'var(--slot-bg)' } */}
  />
))}
```

Per-plakat:
- **flush** ostatniego: `['r']` (albo `['r','b']` tam gdzie było wcześniej i
  `alignItems` nie jest `center`). Reszta: `[]` (pełne pole ochronne) albo `['b']`
  jak dziś przy `alignItems="flex-end"`.
- **Warsztat**: bez `flush` (grafika leży na zdjęciu), `style` z `slot-bg` na
  każdym slocie, `alignItems="center"` outer row zostaje.
- **Konferencja / Gala / Rekrutacja**: `LogoRow` obok pudełka QR/patronat -
  `alignItems="center"` zostaje; pudełko zostaje jako osobny element.
- **gap** `LogoRow` = `LOGO_CLEAR` (jest).
- Gdy `slots` jest puste (PK odznaczony, brak grafik) → `LogoRow` renderuje
  pusty rząd (0 dzieci) - OK, nic nie widać.

## Formularze (8×)

`import { LogoField }` → `import { GraphicsField }`. Zamień oba `<LogoField .../>`
(pk + faculty) — albo jeden (pk) — na:
```tsx
<GraphicsField
  value={value}
  onGraphicsAdd={onGraphicsAdd}
  onGraphicRemove={onGraphicRemove}
  onGraphicMove={onGraphicMove}
  onShowPkChange={onShowPkChange}
/>
```
Usuń nieużywane propsy `onLogoChange`/`onLogoEnabledChange` z destrukturyzacji.

`LogoField.tsx` — do usunięcia (nic już nie importuje).

## Sprzątanie

- `LogoField.tsx` — usuń
- `LogoSlotValue` w `types.ts` — zostaje (LogoSlot go używa)
- `withPlaceholders().logos` — usuń; sprawdź `git grep 'logos\.'` — powinno zostać
  tylko w usuwanych miejscach
- `PhotoGalleryField` / `photos` — **nie ruszać**, to osobny mechanizm (zdjęcia w tle)

## Weryfikacja

- `npm run build` (tsc + vite), `npm test`, `npm run lint`
- Podgląd 8 plakatów w przeglądarce:
  - domyślnie (PK on, brak grafik) — logo PK jak dziś
  - wgranie 2-3 plików naraz — układają się w rzędzie, każdy 48px + pole ochronne
  - odznaczenie „Dodaj logo PK" — PK znika, zostają same grafiki (lub pusto)
  - ▲▼ zmienia kolejność, „Usuń" kasuje
  - eksport PNG z 3 grafikami
  - brak przepełnień przy 4 grafikach

## Implementacja — odstępstwa od szkicu

Wersja z gałęzi `feat/bulk-graphics`:

- **Render slotów:** zamiast `slots.map` inline w każdym plakacie powstał wspólny
  klocek `src/posters/blocks/LogoSlots.tsx` (`slots`, `variant`, `flush`,
  `slotStyle`). `flush` może być tablicą albo funkcją `(i, n) => Side[]`.
- **Przepełnienie stopki:** `LogoRow` dostał `flexWrap: 'wrap'` — gdy grafik jest
  za dużo na jedną linię, nadmiar schodzi do kolejnego wiersza zamiast wychodzić
  poza kadr.
- **Widoczność pól → `display: none`:** przy okazji (prośba użytkownika) `fx()`
  zwraca teraz `{ display: 'none' }` zamiast `{ opacity: 0 }`, `InfoLine` w ogóle
  nie renderuje ukrytych części. Dzięki temu wyłączenie bloku daty/tekstu po lewej
  stronie stopki zwalnia miejsce na grafiki. Pływające pudełko z datą w `Gość`
  owinięte warunkiem, żeby nie zostawało puste.
- **`MAX_GRAPHICS = 4`** w `theme.ts`.

### Kod QR (dogrywka)

`qrcode.react` (`QRCodeSVG`). `FormValues.qrUrl` (link, niezapisywany - jak
`graphics` / `showPkLogo`). Pole „Kod QR" w `GraphicsField`, propsy w komplecie
`gfx`. `QrSlot` (`QR_SIZE = 96`): **tło ZAWSZE przezroczyste**
(`bgColor="transparent"`), kolor modułów = `var(--qr, var(--page-text))` -
**tylko ze schematu** (`schemes.ts`), bez kontrolki w edytorze. `marginRight:
auto` (odbija się maksymalnie w lewo), `value` pusty => `null`. Pierwszy element
rzędu stopki we wszystkich 8 szablonach.

**Rezerwacja miejsca:** rząd stopki (`LogoRow`) ma stałe `minHeight={QR_SLOT_H}`
(`QR_SIZE + 2·LOGO_CLEAR`), a sloty są `alignItems: flex-end`. Dzięki temu
wpisanie/skasowanie linku nie przesuwa niczego w plakacie - QR pojawia się
w miejscu, które i tak jest zarezerwowane. Koszt: stopka każdego szablonu jest
na stałe ~40 px wyższa (jednorazowe przesunięcie środka w górę).

`LogoRow` jest `flex: 1` + `justifyContent: flex-end` - wypełnia szerokość
stopki i pakuje logo do prawej. QrSlot z `marginRight: auto` odbija się w lewo
(do bloku tekstu stopki).

**Ujednolicona stopka:** `LogoRow` sam wysuwa się o `-LOGO_CLEAR` (w prawo i
w dół) i domyślnie `alignItems: flex-end`, `gap: LOGO_CLEAR`. Grafika ma
wewnątrz slotu symetryczny padding `LOGO_CLEAR`, więc jej treść siada dokładnie
na 72 px marginesie kadru - logo PK ląduje w identycznym miejscu (prawy dolny
róg, `right:72 bottom:72`) na wszystkich 8 szablonach. Usunięto per-szablonowe
`flush`. `Ogłoszenie`: `padding` 96→72. `Warsztat`: stopka przebudowana na ten
sam wzorzec (QR + logo w rzędzie, prawy dolny róg).

Przy okazji usunięte nieużywane placeholdery: `patronat` (`Gala`, `Konferencja`),
`kod QR` (`Warsztat`, `Rekrutacja` - zastąpione `QrSlot`). `PlaceholderBox.tsx`
i `placeholderBoxStyle` skasowane (nic już nie używa). Zmienne `--patron-*` /
`--qr-*` w `schemes.ts` zostają nieużywane (bez szkody).

Usunięcie `patronat` z `Gali` + `flexWrap` łagodzi wcześniejsze przepełnienie
stopki - `Rekrutacja` i `Gala` z kodem QR i 1-2 logo mieszczą się w kadrze.
Przy 3-4 bardzo szerokich logo rząd nadal zawija się do 2 linii; na `Rekrutacji`
(clipPath stałej wysokości) może to przyciąć dolny wiersz - realnie rzadkie.

## Poza zakresem

- Kadrowanie / pozycjonowanie grafik (to mają zdjęcia, nie logotypy)
- Zapis grafik w draftcie / historii
- Per-grafika enabled/checkbox widoczności
- Drag-and-drop reorder (tylko ▲▼)
