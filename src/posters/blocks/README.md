# Jak dodać nowy szablon plakatu

Zamiast przepisywać cały mockup z Claude Design na surowe `style={{...}}`,
złóż nowy szablon z gotowych bloków poniżej + zostaw unikalną geometrię
dekoracyjną (clip-pathy, gradienty, pozycjonowane kształty) jako zwykłe,
bespoke divy — to jest ta część designu, której świadomie nie uogólniamy.

## Kroki

1. Skopiuj najbliższy stylistycznie istniejący `Poster*.jsx` jako punkt
   wyjścia (np. `PosterWyklad.jsx` dla layoutu z paddingiem i flex-column).
2. Zamień typowe elementy na bloki (patrz tabela niżej) zamiast pisać je od
   zera.
3. Zdecoruj resztę (trójkąty, clip-pathy, gradienty) bezpośrednio w JSX —
   to jest unikalna część projektu, zwykle skopiowana 1:1 z mockupu.
4. Dodaj plik do `src/posters/registry.js` (klucz `poster_key` = nazwa
   layoutu, komponent, formularz, `schemes: [...]`), do `DEFAULT_TEMPLATES`
   w `src/db/schema.js`, oraz blok `<layout>` do `src/posters/schemes.js`
   (kolory).
5. Sprawdź pod `/poster/<layout>` lub `/poster/<layout>/<scheme>` (np.
   `/poster/gosc/czern`), że dane placeholder (`withPlaceholders` w
   `../fallback.js`) wyglądają sensownie.

## Dostępne bloki

| Blok | Do czego | Przykład |
|---|---|---|
| `PosterFrame` | Kontener 1080×1080 z tłem/kolorem/paddingiem, domyślnie flex-column + space-between | `<PosterFrame vars={s.cssVars} padding={72}>` |
| `Badge` | Plakietka mono z letter-spacingiem — z `background` to wypełniona pigułka, bez niego sam kolorowy napis | `<Badge background="var(--badge-fill)" color="var(--badge-text)">WYKŁAD OTWARTY</Badge>` |
| `BigDateNumber` | Duży "dzień + miesiąc" w jednej linii (np. "12 LIS") | `<BigDateNumber event_date={event_date} color="var(--gold)" />` |
| `InfoLine` | Łączy części (godzina/lokalizacja/cokolwiek) separatorem, opcjonalna druga linia | `<InfoLine parts={[event_time, location]} secondLine={subtitle} />` |
| `BrandingText` | Pionowy blok tekstu mono w rogu (np. nazwa koła/uczelni), domyślnie wyrównany do prawej | `<BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} />` |
| `LogoRow` | Stopka w prawym dolnym rogu (ujednolicona pozycja logo we wszystkich szablonach): sam wysuwa się o pole ochronne, wyrównuje do dołu, `flex-wrap` na nadmiar. `minHeight={QR_SLOT_H}` rezerwuje kod QR | `<LogoRow minHeight={QR_SLOT_H}><QrSlot .../><LogoSlots .../></LogoRow>` |
| `LogoSlot` (`../LogoSlot.tsx`) | Miejsce na logo — wgrane przez użytkownika albo domyślne logo PK | `<LogoSlot logo={logo} variant="light" height={48} />` |
| `LogoSlots` | Renderuje rząd slotów logo z tablicy `slots` (null = fallback PK, string = grafika stopki) | `<LogoSlots slots={slots} variant={s.logoVariant} />` |
| `QrSlot` | Kod QR z linku (`value.qrUrl`), kolor `value.qrColor` (pusty = `var(--page-text)`). Tło zawsze przezroczyste, `marginRight: auto` (odbija się w lewo). Pusty link = `null` | `<QrSlot value={qrUrl} color={qrColor} />` |

Wspólne tokeny typografii (rozmiary/wagi/odstępy używane wewnątrz bloków) są
w `../theme.js` → `typography`. Jedna zmiana tam propaguje się do wszystkich
szablonów, które korzystają z danego bloku.

Każdy blok przyjmuje `style`, który nadpisuje domyślne wartości — użyj tego,
gdy dany szablon potrzebuje np. innego rozmiaru fontu w plakietce, zamiast
kopiować cały styl od zera.

## Kolory i schematy

Plakat nie trzyma kolorów na sztywno. Na górze woła
`const s = resolveScheme('<layout>', scheme)` i przekazuje w dół stringi
`var(--rola)` (nie hexy). `PosterFrame vars={s.cssVars}` rozlewa zmienne CSS na
korzeń 1080×1080, więc każdy potomek (również bloki) widzi `var(--page-bg)`,
`var(--accent)`, `var(--badge-fill)` itd.

Wszystkie wartości kolorów są w `src/posters/schemes.js`, zagnieżdżone po
layoucie: `schemes.<layout>.default` to pełny zestaw ról, nazwane schematy
(`czern`, `zloto`, `jasny`, `szary`, dla Rekrutacji `limonka`) nadpisują tylko
różnice. Dekoracje (trójkąty, kliny) mają własne role z konkretną wartością per
schemat — bez `color-mix`.

`s.sygnet` (nazwa assetu, przez `sygnetByName`) i `s.logoVariant`
(`'light'|'dark'`) też pochodzą ze schematu.
