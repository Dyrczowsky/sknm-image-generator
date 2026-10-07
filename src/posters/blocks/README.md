# Bloki plakatu

Zamiast przepisywać cały mockup na surowe `style={{...}}`, złóż szablon
z gotowych bloków poniżej i zostaw unikalną geometrię dekoracyjną
(clip-pathy, gradienty, pozycjonowane kształty) jako zwykłe, bespoke divy —
to jest ta część designu, której świadomie nie uogólniamy.

Pełna instrukcja dodawania layoutu (plakat, formularz, schemat kolorów, baner,
rejestr, baza): [docs/dodawanie-szablonu.md](../../../docs/dodawanie-szablonu.md).

## Dostępne bloki

| Blok | Do czego | Przykład |
|---|---|---|
| `PosterFrame` | Kontener w rozmiarze kształtu (kwadrat 1080×1080, papier, baner) z tłem/kolorem/paddingiem, domyślnie flex-column + space-between | `<PosterFrame vars={cssVars} padding={72}>` |
| `Sygnet` | Sygnet SKNM w wariancie ze schematu kolorów | `<Sygnet name={sygnet} />` |
| `Badge` | Plakietka mono z letter-spacingiem — z `background` to wypełniona pigułka, bez niego sam kolorowy napis. Domyślna treść z `DEFAULT_BADGE` w `../copy.ts` | `<Badge background="var(--badge-fill)" color="var(--badge-text)">{badge \|\| DEFAULT_BADGE.wyklad[lang]}</Badge>` |
| `BigDateNumber` | Duży "dzień + miesiąc" w jednej linii (np. "12 LIS" / "12 NOV") | `<BigDateNumber event_date={event_date} color="var(--gold)" lang={lang} />` |
| `InfoLine` | Łączy części (godzina/lokalizacja/cokolwiek) separatorem, opcjonalna druga linia; pomija puste i ukryte | `<InfoLine parts={[event_time, location]} secondLine={subtitle} />` |
| `BrandingText` | Pionowy blok tekstu mono w rogu (np. nazwa koła/uczelni), domyślnie wyrównany do prawej | `<BrandingText lines={BRANDING_SHORT[lang]} />` |
| `FooterLogos` | Stopka: kod QR maksymalnie w lewo, logotypy w prawym dolnym rogu (ta sama pozycja we wszystkich szablonach). Rezerwuje wysokość na QR, zawija nadmiar grafik | `<FooterLogos qrUrl={qrUrl} slots={logoSlots} variant={logoVariant} />` |
| `LogoSlots` | Rząd grafik stopki z tablicy `slots` (`null` = logo PK, string = wgrana grafika). Zwykle przez `FooterLogos` | `<LogoSlots slots={logoSlots} variant={logoVariant} />` |
| `QrSlot` | Kod QR z linku. Tło przezroczyste, kolor modułów = rola `qr` ze schematu (`var(--qr, var(--page-text))`). Pusty link = `null`. Zwykle przez `FooterLogos` | `<QrSlot value={qrUrl} size={QR_SIZE} />` |
| `Triangle` / `FadingTriangles` | Trójkąt wierzchołkiem w dół (motyw sygnetu) i pionowy stos trzech gasnących | `<Triangle width={46} height={40} color="var(--accent)" />` |
| `Wedges` | Tło z trzech klinów (role `washTop` / `wedgeBr` / `wedgeBl`), skalowane z ramką | `<Wedges />` |

Miejsce na zdjęcia to `PhotoGallery` (`../PhotoGallery.tsx`).

Wspólne tokeny typografii (rozmiary/wagi/odstępy używane wewnątrz bloków) są
w `../theme.ts` → `typography`. Jedna zmiana tam propaguje się do wszystkich
szablonów, które korzystają z danego bloku.

Bloki tekstowe przyjmują `style`, który nadpisuje domyślne wartości — użyj tego,
gdy dany szablon potrzebuje np. innego rozmiaru fontu w plakietce, zamiast
kopiować cały styl od zera.

## Kolory i schematy

Plakat nie trzyma kolorów na sztywno. Na górze woła
`const { cssVars, sygnet, logoVariant } = resolveScheme('<layout>', scheme, accent)`
i przekazuje w dół stringi `var(--rola)` (nie hexy). `PosterFrame vars={cssVars}`
rozlewa zmienne CSS na korzeń plakatu, więc każdy potomek (również bloki) widzi
`var(--page-bg)`, `var(--accent)`, `var(--badge-fill)` itd.

Wszystkie wartości kolorów są w `../schemes.ts`, zagnieżdżone po layoucie:
blok bazowy (`default`, a w Rekrutacji `limonka`) to pełny zestaw ról, nazwane
schematy (`czern`, `jasny`, `szary`, `okazjonalny`, ...) nadpisują tylko różnice,
a oś akcentu dokłada nadpisania z recepty layoutu. Dekoracje (trójkąty, kliny)
mają własne role z konkretną wartością per schemat — bez `color-mix`. Szczegóły:
[docs/dodawanie-schematu-kolorow.md](../../../docs/dodawanie-schematu-kolorow.md).
