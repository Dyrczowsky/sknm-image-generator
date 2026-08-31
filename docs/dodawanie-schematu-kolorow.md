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

Kolor `colors.gold` w roli akcentu łączymy **wyłącznie** z sygnetem `'zloty'`,
a `colors.silver` z `'srebrny'` (schematy „okazjonalny złoty" / „okazjonalny
srebrny"). W pozostałych wariantach akcent to `lime` / `coral` / `navy`.

Komponent plakatu używa roli jako zmiennej CSS w stylu inline:

```tsx
<div style={{ background: 'var(--page-bg)', color: 'var(--accent)' }}>
```

`resolveScheme(layoutKey, schemeName)` scala blok bazowy layoutu (`default`, a gdy
go nie ma - pierwszy schemat) + nazwany wariant i zwraca `{ cssVars, sygnet,
logoVariant }`. `cssVars` jest rozlewane na `PosterFrame` (`vars={s.cssVars}`),
więc `var(--rola)` działa u każdego potomka.

**Lista schematów w UI wynika wprost z `schemes.ts`** - `schemesFor(layoutKey)`
zwraca `Object.keys` bloku layoutu, w kolejności zapisu (pierwszy = domyślny).
Nie ma osobnej listy w `registry.ts`. Layout z jednym schematem nie pokazuje
paska kolorystyki.

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

1. W `schemes.ts`, w bloku `const wyklad: LayoutSchemes = { ... }`, dopisz wariant
   w miejscu, w którym ma się pojawić na pasku (kolejność kluczy = kolejność
   swatchy). Podajesz **tylko** to, co różni się od bloku bazowego (`wyklad.default`):

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

   To wystarczy, żeby swatch pojawił się w generatorze — `registry.ts` nie
   trzyma listy schematów.

2. Podpis swatcha — jeśli nazwa jest nowa, dopisz do `SCHEME_LABELS` na dole
   `schemes.ts` (bez wpisu swatch pokaże surowy klucz):

   ```ts
   export const SCHEME_LABELS: Record<string, string> = {
     // ...
     morski: 'Morski',
   }
   ```

3. Sprawdź: `npm run build && npm test`, potem podgląd
   `http://localhost:5173/sknm-image-generator/poster/wyklad/morski`
   i pasek kolorystyki w generatorze.

## B. Nowa rola koloru (gdy layout potrzebuje kolejnego sterowanego elementu)

1. Dodaj klucz roli do **`default`** danego layoutu (i tam, gdzie się różni,
   do pozostałych wariantów).
2. Użyj `var(--nowa-rola)` w komponencie plakatu (`camelCase` → `--kebab`).
3. Resolver nie wymaga zmian — dowolny klucz spoza `sygnet`/`logoVariant`
   automatycznie trafia do `cssVars`.

## C. Layout bez bloku `default` (jak Rekrutacja)

Rekrutacja nie ma klucza `default` - jej blokiem bazowym jest **pierwszy
schemat** (`limonka`), bo `resolveScheme` bierze `layout.default ?? layout[
pierwszy klucz]`. Dzięki temu `czernZolta`/`okazjonalnyZloty`/... dziedziczą
wspólne role (`footerText`, `qrBorder`, ...) wprost z `limonka` i nie trzeba
żadnego aliasu.

Stosuj ten wzorzec, gdy "domyślny" wygląd layoutu ma własną nazwę na pasku
kolorystyki: napisz go jako pełny pierwszy blok, reszta podaje tylko różnice.

## Checklist

- [ ] blok wariantu w `schemes.ts` (tylko różnice względem bloku bazowego),
      w miejscu = pozycja swatcha
- [ ] blok bazowy layoutu (`default` lub pierwszy schemat) ma **wszystkie**
      role używane przez komponent
- [ ] podpis w `SCHEME_LABELS` (jeśli nowa nazwa)
- [ ] `npm run build && npm test`
- [ ] podgląd `/poster/<layout>/<wariant>` + pasek kolorystyki w generatorze
