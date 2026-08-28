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
4. Dodaj plik do `src/posters/registry.js` (klucz `poster_key`, nazwa,
   komponent) oraz do `DEFAULT_TEMPLATES` w `src/db/schema.js`.
5. Sprawdź pod `/poster/:id` (np. `/poster/wyklad`), że dane placeholder
   (`withPlaceholders` w `../fallback.js`) wyglądają sensownie.

## Dostępne bloki

| Blok | Do czego | Przykład |
|---|---|---|
| `PosterFrame` | Kontener 1080×1080 z tłem/kolorem/paddingiem, domyślnie flex-column + space-between | `<PosterFrame background={colors.navy} color={colors.cream} padding={72}>` |
| `Badge` | Plakietka mono z letter-spacingiem — z `background` to wypełniona pigułka, bez niego sam kolorowy napis | `<Badge background={colors.lime} color={colors.limeText}>WYKŁAD OTWARTY</Badge>` |
| `BigDateNumber` | Duży "dzień + miesiąc" w jednej linii (np. "12 LIS") | `<BigDateNumber event_date={event_date} color={colors.gold} />` |
| `InfoLine` | Łączy części (godzina/lokalizacja/cokolwiek) separatorem, opcjonalna druga linia | `<InfoLine parts={[event_time, location]} secondLine={subtitle} />` |
| `BrandingText` | Pionowy blok tekstu mono w rogu (np. nazwa koła/uczelni), domyślnie wyrównany do prawej | `<BrandingText lines={['SKNM', 'POLITECHNIKA', 'KRAKOWSKA']} />` |
| `LogoRow` | Rząd `LogoSlot`/`PlaceholderBox` ze spójnym odstępem | `<LogoRow><LogoSlot .../><LogoSlot .../></LogoRow>` |
| `LogoSlot` (`../LogoSlot.jsx`) | Miejsce na logo — wgrane przez użytkownika albo domyślne logo PK | `<LogoSlot logo={logo} variant="light" width={190} height={72} />` |
| `PlaceholderBox` (`../PlaceholderBox.jsx`) | Przerywany placeholder na zdjęcie/QR/patronat | `<PlaceholderBox label="kod QR" width={150} height={150} />` |

Wspólne tokeny typografii (rozmiary/wagi/odstępy używane wewnątrz bloków) są
w `../theme.js` → `typography`. Jedna zmiana tam propaguje się do wszystkich
szablonów, które korzystają z danego bloku.

Każdy blok przyjmuje `style`, który nadpisuje domyślne wartości — użyj tego,
gdy dany szablon potrzebuje np. innego rozmiaru fontu w plakietce, zamiast
kopiować cały styl od zera.
