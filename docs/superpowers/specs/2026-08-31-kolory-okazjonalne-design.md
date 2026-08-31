# Wersje kolorystyczne: złoto/srebro okazjonalne, naprawa naruszeń

## Cel

Ujednolicić schematy kolorów wokół jednej zasady:

- **`colors.gold`** może wystąpić w schemacie **wyłącznie** razem z sygnetem
  `zloty`.
- **`colors.silver`** (nowy) — **wyłącznie** razem z sygnetem `srebrny` (nowy).
- W pozostałych przypadkach akcent to jeden z trzech kolorów firmowych:
  **żółty** (`colors.lime`), **pomarańczowy** (`colors.coral`),
  **granatowy** (`colors.navy`, a na ciemnym tle `colors.navyLight`).

Każdy schemat, w którym dziś złoto łączy się z sygnetem innym niż `zloty`, jest
naprawiany. Schematy złote są jawnie nazwane **„Okazjonalny złoty"**, srebrne —
**„Okazjonalny srebrny"**.

### Stan wyjściowy (naruszenia)

| Layout | Schemat | Problem |
|---|---|---|
| `ogloszenie` | `czern` | `accent: gold` + `sygnet: negatywny` |
| `gosc` | `czern` | `accent: gold` + `sygnet: negatywny` |
| `wyklad` | `czern` | `badgeFill/speaker/chips: gold` + `sygnet: negatywny` |
| `konferencja` | `czern` | `headerBadge/lineFirst/footerBadge: gold` + `sygnet: negatywny` |
| `rekrutacja` | `czern` | `band: gold` + `sygnet: negatywny` |
| `rekrutacja` | `zloto` | `pageBg: gold` + `sygnet: czarny` |
| `warsztat` | `czern` | `badgeFill/pillFill: gold` + `sygnet: negatywny` |

`data.czern` jest **czysta** (trójkąty `lime`/`coral`/`cream`, sygnet negatywny) —
nie jest naruszeniem. `data.zloto`, `gala` (default), `gosc.gala`, `*.zloto`
(pozostałe) są zgodne (złoto + sygnet zloty).

## Nowe zasoby

### `src/posters/theme.ts` — `colors`

Dodać:

```ts
silver: '#C6C7CB',      // jasne srebro — akcent na ciemnych tłach (bliźniak `gold`)
```

Tekst na srebrnych plakietkach/pigułkach: używamy istniejącego `colors.ink`
(`#16182F`) — bez nowego tokenu.

### `src/assets/brand/sknm/sygnet_srebrny.svg` — nowy plik

`sygnet_szary.svg` i `sygnet_zloty.svg` są bajtowo identyczne poza kolorem
wypełnienia (`style="fill:#8a8d8f;"` vs `#84754e`). Nowy plik = kopia
`sygnet_szary.svg` z `fill:#8a8d8f` → `fill:#c6c7cb` (zgodnie z `colors.silver`).
Generujemy w repo, użytkownik nic nie wgrywa.

### `src/types.ts` — `SygnetName`

```ts
export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny' | 'srebrny'
```

### `src/posters/logos.ts`

```ts
import sygnetSrebrny from '../assets/brand/sknm/sygnet_srebrny.svg'
// ...
export const sygnetByName: Record<SygnetName, string> = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
  srebrny: sygnetSrebrny,
}
```

## Klucze i etykiety schematów

Klucze schematów — camelCase, ASCII (bez polskich znaków), spójne z dzisiejszymi
(`czern`, `limonka`). Etykiety w `SCHEME_LABELS` — z polską ortografią.

Przemianowania:
- `zloto` → **`okazjonalnyZloty`** (wszystkie layouty które go mają)
- nowy **`okazjonalnySrebrny`**
- `czern` w 6 layoutach z naruszeniem → **`czernZolta` / `czernPomaranczowa` / `czernGranatowa`**
- `czern` w `data` → zostaje `czern`
- `gosc.gala` → usunięty (zwinięty do `okazjonalnyZloty`)
- `rekrutacja.zloto` (pełnozłote tło) → usunięty; `okazjonalnyZloty` Rekrutacji ma czarne tło

`SCHEME_LABELS` (docelowo):

```ts
export const SCHEME_LABELS: Record<string, string> = {
  default: 'Granat',
  limonka: 'Limonka',
  czern: 'Czerń',
  czernZolta: 'Czerń żółta',
  czernPomaranczowa: 'Czerń pomarańczowa',
  czernGranatowa: 'Czerń granatowa',
  okazjonalnyZloty: 'Okazjonalny złoty',
  okazjonalnySrebrny: 'Okazjonalny srebrny',
  jasny: 'Jasny',
  szary: 'Szary',
}
```

Usunięte: `zloto`, `gala`.

Kolejność kluczy w każdym bloku layoutu = kolejność swatchy w pasku
(`schemesFor` = `Object.keys`). Pierwszy klucz = schemat domyślny
(`defaultSchemeFor` → `list[0]`). Kolejność docelowa dla layoutów z naruszeniem:

```
default, czernZolta, czernPomaranczowa, czernGranatowa,
okazjonalnyZloty, okazjonalnySrebrny, jasny, szary
```

## `src/posters/schemes.ts` — bloki layoutów

Zasady wspólne:
- Każdy nowy schemat na czarnym/granatowym tle ustawia `logoVariant`
  jawnie (`dark` gdy logo PK leży na ciemnym, `light` na jasnym/na kolorowej
  bandzie) — nie polegać na dziedziczeniu z `default`, gdy `default` ma inny
  wariant.
- „Granatowy akcent" na ciemnym tle = `colors.navyLight` (`#4A54B4`), na jasnym =
  `colors.navy`.
- Wedge/wash literały w `wyklad` dla wariantów `czern*` — te same co dzisiejsze
  `czern`/`zloto` (`#1E1E1E` / `#0A0A0A` / `rgba(255,255,255,.04)`).

### `ogloszenie` (rola akcentu: `accent`)

`default` bez zmian: `pageBg navy, pageText cream, accent lime, sygnet negatywny, logoVariant dark`.

```ts
czernZolta:        { pageBg: colors.black, accent: colors.lime,      sygnet: 'negatywny' },
czernPomaranczowa: { pageBg: colors.black, accent: colors.coral,     sygnet: 'negatywny' },
czernGranatowa:    { pageBg: colors.black, accent: colors.navyLight, sygnet: 'negatywny' },
okazjonalnyZloty:  { accent: colors.gold,   sygnet: 'zloty' },   // tło navy z default (= dzisiejsze `zloto`)
okazjonalnySrebrny:{ accent: colors.silver, sygnet: 'srebrny' },
```

`jasny`, `szary` — bez zmian.

### `gosc` (rola akcentu: `accent`; `gosc.gala` usunięty)

`default` bez zmian: `pageBg cream, pageText ink, mutedText textMuted, accent navy, sygnet negatywny, logoVariant light`.

```ts
czernZolta:        { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted, accent: colors.lime,      sygnet: 'negatywny', logoVariant: 'dark' },
czernPomaranczowa: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted, accent: colors.coral,     sygnet: 'negatywny', logoVariant: 'dark' },
czernGranatowa:    { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted, accent: colors.navyLight, sygnet: 'negatywny', logoVariant: 'dark' },
okazjonalnyZloty:  { pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted, accent: colors.gold,   sygnet: 'zloty',   logoVariant: 'dark' },
okazjonalnySrebrny:{ pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted, accent: colors.silver, sygnet: 'srebrny', logoVariant: 'dark' },
```

`jasny` (`{ pageBg: colors.paper }`), `szary` — bez zmian.

### `data` (role: `tri1`/`tri2`/`tri3`; BEZ podziału na 3 warianty czerni)

`default`, `czern`, `jasny`, `szary` — bez zmian. `zloto` → `okazjonalnyZloty`
(wartości bez zmian). Dodać:

```ts
okazjonalnySrebrny: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  title: colors.cream, tri1: colors.silver, tri2: colors.coral, tri3: colors.cream,
  sygnet: 'srebrny', logoVariant: 'dark',
},
```

Docelowa lista `data`: `default, czern, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`.

### `wyklad` (role: `badgeFill`/`badgeText`/`speaker`/`chips`)

`default` bez zmian. `zloto` → `okazjonalnyZloty` (wartości bez zmian, tło `black`,
sygnet `zloty`).

```ts
czernZolta: {
  pageBg: colors.black, badgeFill: colors.lime, badgeText: colors.limeText,
  speaker: colors.lime, chips: colors.lime,
  washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
  sygnet: 'negatywny',
},
czernPomaranczowa: {
  pageBg: colors.black, badgeFill: colors.coral, badgeText: colors.cream,
  speaker: colors.coral, chips: colors.coral,
  washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
  sygnet: 'negatywny',
},
czernGranatowa: {
  pageBg: colors.black, badgeFill: colors.navyLight, badgeText: colors.cream,
  speaker: colors.navyLight, chips: colors.navyLight,
  washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
  sygnet: 'negatywny',
},
okazjonalnySrebrny: {
  pageBg: colors.black, badgeFill: colors.silver, badgeText: colors.ink,
  speaker: colors.silver, chips: colors.silver,
  washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
  sygnet: 'srebrny',
},
```

`default` `wyklad` ma `logoVariant: 'dark'` → warianty `czern*`/`okazjonalny*`
dziedziczą `dark` (tło czarne — OK), nie trzeba nadpisywać. `jasny`, `szary` —
bez zmian.

### `konferencja` (role: `headerBadge`/`lineFirst`/`lineRest`/`footerBadge`; `panel`)

`default` bez zmian (`logoVariant: 'light'`). `zloto` → `okazjonalnyZloty`
(wartości bez zmian: `pageBg navy, panel inkPanel, *Badge gold, lineFirst gold,
lineRest 'rgba(244,242,237,.2)', sygnet zloty, logoVariant dark`).

```ts
czernZolta: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  panel: colors.inkPanel, headerBadge: colors.lime,
  lineFirst: colors.lime, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.lime,
  sygnet: 'negatywny', logoVariant: 'dark',
},
czernPomaranczowa: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  panel: colors.inkPanel, headerBadge: colors.coral,
  lineFirst: colors.coral, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.coral,
  sygnet: 'negatywny', logoVariant: 'dark',
},
czernGranatowa: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  panel: colors.inkPanel, headerBadge: colors.navyLight,
  lineFirst: colors.navyLight, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.navyLight,
  sygnet: 'negatywny', logoVariant: 'dark',
},
okazjonalnySrebrny: {
  pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
  panel: colors.inkPanel, headerBadge: colors.silver,
  lineFirst: colors.silver, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.silver,
  sygnet: 'srebrny', logoVariant: 'dark',
},
```

`jasny`, `szary` — bez zmian.

### `rekrutacja` (baza = pierwszy schemat `limonka`; role: `band`/`subColor`/`footerText`/`badgeColor`)

`limonka` (baza) bez zmian. `zloto` (pełnozłote tło) **usunięty**. `czern` →
trzy warianty + złoty/srebrny na czarnym tle:

```ts
czernZolta: {
  pageBg: colors.black, pageText: colors.cream,
  band: colors.lime, subColor: colors.creamMuted, footerText: colors.limeText,
  badgeColor: colors.black,
  qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
  sygnet: 'negatywny', logoVariant: 'light',   // logo PK leży na jasnej bandzie
},
czernPomaranczowa: {
  pageBg: colors.black, pageText: colors.cream,
  band: colors.coral, subColor: colors.creamMuted, footerText: colors.cream,
  badgeColor: colors.cream,
  qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
  sygnet: 'negatywny', logoVariant: 'light',
},
czernGranatowa: {
  pageBg: colors.black, pageText: colors.cream,
  band: colors.navyLight, subColor: colors.creamMuted, footerText: colors.cream,
  badgeColor: colors.cream,
  qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
  sygnet: 'negatywny', logoVariant: 'dark',
},
okazjonalnyZloty: {
  pageBg: colors.black, pageText: colors.cream,
  band: colors.gold, subColor: colors.creamMuted, footerText: colors.ink,
  badgeColor: colors.black,
  qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
  sygnet: 'zloty', logoVariant: 'light',
},
okazjonalnySrebrny: {
  pageBg: colors.black, pageText: colors.cream,
  band: colors.silver, subColor: colors.creamMuted, footerText: colors.ink,
  badgeColor: colors.ink,
  qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
  sygnet: 'srebrny', logoVariant: 'light',
},
```

`jasny`, `szary` — bez zmian. Docelowa lista `rekrutacja`:
`limonka, czernZolta, czernPomaranczowa, czernGranatowa, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`.

> Uwaga do przeglądu na żywo: `logoVariant` na kolorowej bandzie (`lime`/`coral`
> vs `gold`/`silver`) dobrany „na oko" — zweryfikować renderem, poprawić jeśli
> logo PK ginie.

### `warsztat` (role: `title`/`badgeFill`/`badgeText`/`pillFill`/`pillText`/`slotBg`)

`default` bez zmian (`logoVariant: 'light'`). `zloto` → `okazjonalnyZloty`
(wartości bez zmian: `pageBg navy, title cream, badgeFill/pillFill gold,
badgeText/pillText ink, slotBg navy, qr rgba, sygnet zloty, logoVariant dark`).

```ts
czernZolta: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  title: colors.cream, badgeFill: colors.lime, badgeText: colors.limeText,
  pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.black,
  qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
  sygnet: 'negatywny', logoVariant: 'dark',
},
czernPomaranczowa: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  title: colors.cream, badgeFill: colors.coral, badgeText: colors.cream,
  pillFill: colors.coral, pillText: colors.cream, slotBg: colors.black,
  qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
  sygnet: 'negatywny', logoVariant: 'dark',
},
czernGranatowa: {
  pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
  title: colors.cream, badgeFill: colors.navyLight, badgeText: colors.cream,
  pillFill: colors.navyLight, pillText: colors.cream, slotBg: colors.black,
  qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
  sygnet: 'negatywny', logoVariant: 'dark',
},
okazjonalnySrebrny: {
  pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
  title: colors.cream, badgeFill: colors.silver, badgeText: colors.ink,
  pillFill: colors.silver, pillText: colors.ink, slotBg: colors.navy,
  qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
  sygnet: 'srebrny', logoVariant: 'dark',
},
```

`jasny`, `szary` — bez zmian.

### `gala` (jeden schemat → dwa)

```ts
const gala: LayoutSchemes = {
  okazjonalnyZloty: {
    pageBg: colors.ink, pageText: colors.goldPanelText, mutedText: colors.creamMuted,
    gold: colors.gold, panelBr: colors.inkPanel,
    patronBorder: 'rgba(184,148,58,.5)', patronText: 'rgba(240,237,228,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    gold: colors.silver,
    patronBorder: 'rgba(198,199,203,.5)',
    sygnet: 'srebrny',
  },
}
```

Rola CSS zostaje `--gold` (w schemacie srebrnym niesie wartość srebra) — dzięki
temu `PosterGala.tsx` nie potrzebuje zmian nazw. Wymagana jedna korekta w
`PosterGala.tsx`: końce gradientu linii pod nagłówkiem są dziś zaszyte jako
`rgba(132,117,78,0)` (złoto z zerową alfą). Zmienić na `transparent`, żeby
gradient działał dla dowolnego koloru `--gold`:

```tsx
background: `linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)`
```

Gala zyskuje pasek kolorystyki (2 swatche) — `SchemeSelector` pokazuje się przy
`schemeList.length > 1`. `defaultSchemeFor` zwróci `'okazjonalnyZloty'` (pierwszy
klucz) zamiast dotychczasowego `undefined` — bez wpływu na render
(`resolveScheme('gala', 'okazjonalnyZloty')` = ten sam blok bazowy).

## `src/posters/schemes.ts` — bez zmian w resolverze

`resolveScheme`, `schemesFor`, `baseBlock`, `roleToVar`, `NON_CSS` — bez zmian.
Klucze wielosłowne (`czernZolta`) przechodzą przez `Object.keys` i URL
(`/poster/:key/:scheme`, regex `([^/]+)`) bez problemu.

## Migracja bazy — `src/db/schema.ts`

Klucze `zloto`, `czern` (dla layoutów innych niż `data`), `gala` (dla `gosc`)
znikają. Zapisany `draft.color_scheme` / `generated_images.color_scheme` mógłby
wskazywać nieistniejący schemat. Zgodnie z przyjętą strategią (komentarz w
`schema.ts`): podbić `SCHEMA_VERSION` `3 → 4`. `resetIfStale` przy następnym
starcie zrzuci `generated_images`, `draft`, `templates`; `syncTemplates` odtworzy
szablony z `DEFAULT_TEMPLATES`. **Lokalny draft i historia użytkownika zostają
wyczyszczone** (zaakceptowane).

Zmienić też komentarz nad `SCHEMA_VERSION` (dopisać `v4: przemianowane klucze
schematów kolorów`).

## Testy — `src/posters/schemes.test.ts`

1. **Przepisać asercje** odwołujące się do starych kluczy
   (`resolveScheme('ogloszenie', 'czern')` → `'czernZolta'` itd.),
   `resolveScheme('rekrutacja', 'zloto')` → `'okazjonalnyZloty'`,
   `SCHEME_LABELS.czern` → `'Czerń'` (nadal istnieje, dla `data`) — dopisać test
   `SCHEME_LABELS.okazjonalnyZloty === 'Okazjonalny złoty'`.
2. **Zachować** test-invariant „każdy layout ma niepustą listę schematów; każdy
   (z bazą) zwraca sygnet + logoVariant + niepusty cssVars".
3. **Dodać nowy invariant** (kodyfikacja zasady):

```ts
it('invariant: gold tylko z sygnetem zloty, silver tylko ze srebrny', () => {
  for (const layout of Object.keys(schemes)) {
    for (const name of [undefined, ...schemesFor(layout)]) {
      const s = resolveScheme(layout, name)
      const vals = Object.values(s.cssVars)
      if (vals.includes(colors.gold))
        expect(s.sygnet, `${layout}/${name}: gold bez sygnetu zloty`).toBe('zloty')
      if (vals.includes(colors.silver))
        expect(s.sygnet, `${layout}/${name}: silver bez sygnetu srebrny`).toBe('srebrny')
    }
  }
})
```

4. **Dodać** krótką asercję dla `gala` (dwa schematy, `okazjonalnySrebrny` niesie
   `--gold === colors.silver` i `sygnet === 'srebrny'`).

## Pliki

| Plik | Zmiana |
|---|---|
| `src/posters/theme.ts` | `+ colors.silver` |
| `src/types.ts` | `SygnetName += 'srebrny'` |
| `src/assets/brand/sknm/sygnet_srebrny.svg` | nowy (kopia `szary` + srebrny fill) |
| `src/posters/logos.ts` | import + wpis w `sygnetByName` |
| `src/posters/schemes.ts` | przebudowa bloków 8 layoutów + `SCHEME_LABELS` |
| `src/posters/PosterGala.tsx` | końce gradientu → `transparent` (1 linia) |
| `src/db/schema.ts` | `SCHEMA_VERSION 3 → 4` + komentarz |
| `src/posters/schemes.test.ts` | przepisane asercje + 2 nowe invarianty |

Bez zmian: komponenty plakatów (poza `PosterGala`), `SchemeSelector`,
`App.tsx`, `registry.ts`, formularze.

## Weryfikacja

- `npm test` — zielone (w tym oba invarianty).
- `npm run build` — `tsc` + `vite` bez błędów (kompletność `Record<SygnetName, …>`
  w `logos.ts` wymusza obsługę `srebrny`).
- `npm run lint`.
- **Przegląd na żywo** (uruchomienie apki, prośba do użytkownika): dla każdego z 8
  layoutów przejść pasek kolorystyki — w szczególności:
  - trzy warianty „Czerń" (żółty/pomarańczowy/granatowy akcent, sygnet negatywny),
  - „Okazjonalny złoty" (złoty sygnet) i „Okazjonalny srebrny" (srebrny sygnet),
  - Gala: nowy pasek 2 swatchy,
  - Rekrutacja: czytelność logo PK na kolorowej/złotej/srebrnej bandzie
    (`logoVariant` do ewentualnej korekty),
  - `czernGranatowa`: kontrast `navyLight` na czerni.
- Odcień `colors.silver` i wypełnienia `sygnet_srebrny.svg` — dostroić po obejrzeniu.

## Poza zakresem

- Rozdzielenie „tła" i „akcentu" na osobne osie wyboru (pełna kombinatoryka) —
  odrzucone, YAGNI.
- Migracja zachowująca lokalny draft/historię (mapowanie starych kluczy) —
  odrzucone na rzecz resetu wersji schematu (precedens w repo).
- Nowe warianty kolorystyczne dla `data` poza srebrnym (trójkąty są
  wielokolorowe z założenia).
- Jasny/ciemny wariant „srebra" na jasnym tle — srebro występuje tylko na
  ciemnym (jak złoto).
