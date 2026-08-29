# Dodawanie schematu kolorów ("motywu")

Schematy kolorów żyją w `src/posters/schemes.ts` i są **zagnieżdżone per layout**.
"Granat" Wykładu (biały na granacie) to nie to samo co "granat" Warsztatu
(granat na kremie), więc każdy layout ma własny zestaw wariantów.

## Model: role, nie stany

Plakat nie zna pojęć "jasny/ciemny". Zna **role kolorów** — nazwane funkcje
w obrębie layoutu:

- wspólne: `pageBg`, `pageText`, `mutedText`, `accent`
- specyficzne dla layoutu, np. Wykład: `badgeFill`, `badgeText`, `speaker`,
  `chips`, `washTop`, `wedgeBr`, `wedgeBl`

Komponent plakatu używa roli jako zmiennej CSS w stylu inline:

```tsx
<div style={{ background: 'var(--page-bg)', color: 'var(--accent)' }}>
```

`resolveScheme(layoutKey, schemeName)` scala `default` + nazwany wariant i zwraca
`{ cssVars, sygnet, logoVariant }`. `cssVars` jest rozlewane na `PosterFrame`
(`vars={s.cssVars}`), więc `var(--rola)` działa u każdego potomka.

### Konwersja nazw

Klucz roli w `schemes.ts` jest w `camelCase`; resolver zamienia go na `--kebab`:

| rola w `schemes.ts` | zmienna CSS w JSX |
|---|---|
| `pageBg` | `var(--page-bg)` |
| `badgeFill` | `var(--badge-fill)` |
| `accent` | `var(--accent)` |

`sygnet` i `logoVariant` **nie** są zmiennymi CSS — resolver zwraca je osobno
(`s.sygnet`, `s.logoVariant`), komponent podaje je do `sygnetByName[...]` i `LogoSlot`.

### `⚠️` Każda rola musi być w `default`

Rola nieobecna w bloku `default` danego layoutu **nie renderuje pustki** —
`var(--rola)` spada do wartości z `:root` w `src/index.css` (gdzie `--accent` to
firmowy niebieski aplikacji, nie kolor plakatu). Dlatego blok `default` layoutu
musi zawierać **wszystkie** role, których używa jego komponent. Nazwane warianty
nadpisują tylko różnice.

## A. Nowy wariant dla istniejącego layoutu

Przykład: dodajemy wariant `morski` do Wykładu.

1. W `schemes.ts`, w bloku `const wyklad: LayoutSchemes = { ... }`, dopisz wariant.
   Podajesz **tylko** to, co różni się od `wyklad.default`:

   ```ts
   morski: {
     pageBg: '#0B3D46', pageText: colors.cream,
     badgeFill: colors.lime, badgeText: colors.limeText,
     speaker: colors.lime, chips: colors.lime,
     washTop: 'rgba(255,255,255,.05)', wedgeBr: '#12525E', wedgeBl: '#082F37',
     sygnet: 'negatywny', logoVariant: 'dark',
   }
   ```

   Wartości: token z `colors` (`src/posters/theme.ts`) albo literał (`#0B3D46`,
   `rgba(...)`, `oklch(...)`). Jeśli role są dekoracyjne i mają jawne wartości per
   wariant (jak kliny Wykładu) — nie ma `color-mix`, wpisujesz konkretny kolor.

2. Dodaj wariant do listy w `registry.ts` (kolejność = kolejność swatchy w UI):

   ```ts
   wyklad: {
     name: 'Wykład', Component: PosterWyklad, Form: FormWyklad,
     schemes: ['default', 'zloto', 'czern', 'jasny', 'szary', 'morski'],
   },
   ```

3. Podpis swatcha — jeśli nazwa jest nowa, dopisz do `SCHEME_LABELS` na dole
   `schemes.ts`:

   ```ts
   export const SCHEME_LABELS: Record<string, string> = {
     // ...
     morski: 'Morski',
   }
   ```

4. Sprawdź: `npm run build && npm test`, potem podgląd
   `http://localhost:5173/sknm-image-generator/poster/wyklad/morski`
   i pasek kolorystyki w generatorze.

## B. Nowa rola koloru (gdy layout potrzebuje kolejnego sterowanego elementu)

1. Dodaj klucz roli do **`default`** danego layoutu (i tam, gdzie się różni,
   do pozostałych wariantów).
2. Użyj `var(--nowa-rola)` w komponencie plakatu (`camelCase` → `--kebab`).
3. Resolver nie wymaga zmian — dowolny klucz spoza `sygnet`/`logoVariant`
   automatycznie trafia do `cssVars`.

## C. Wariant jako alias (jak Rekrutacja)

Rekrutacja ma domyślny schemat `limonka`, nie `default`. Żeby `zloto`/`jasny`/
`szary` odziedziczyły wspólne role (`footerText`, `qrBorder`, ...), na końcu bloku
jest:

```ts
rekrutacja.default = { ...rekrutacja.limonka }
```

Resolver scala nazwany wariant nad `default`, więc bez tego aliasu warianty inne
niż `limonka` nie miałyby wspólnej bazy. Stosuj ten wzorzec, gdy "domyślny"
wygląd layoutu ma własną nazwę na pasku kolorystyki.

## Checklist

- [ ] blok wariantu w `schemes.ts` (tylko różnice względem `default`)
- [ ] `default` layoutu ma **wszystkie** role używane przez komponent
- [ ] wariant dopisany do `schemes: [...]` w `registry.ts`
- [ ] podpis w `SCHEME_LABELS` (jeśli nowa nazwa)
- [ ] `npm run build && npm test`
- [ ] podgląd `/poster/<layout>/<wariant>` + eksport PNG
