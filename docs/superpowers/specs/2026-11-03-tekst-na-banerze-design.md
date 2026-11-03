# Tekst wydarzenia na banerach — projekt

## Po co

Banery (okładka strony na Facebooku 1640×624 i okładka wydarzenia 1920×1005)
pokazują dziś tylko stałą nazwę koła, adres strony, logotypy i kod QR. Dla
wydarzenia na Facebooku trzeba na banerze nazwy wydarzenia, daty i miejsca —
teraz nie da się ich tam umieścić.

## Co ma powstać

### Duży tekst banera (zamiast stałej nazwy koła)

- Nowe pole formularza **`bannerTitle`** (tekst z formatowaniem, jak inne pola
  tekstowe), **osobne od tytułu plakatu** — zmiana jednego nie rusza drugiego.
- Puste pole = baner pokazuje nazwę koła w języku plakatu (`CLUB_NAME[lang]`),
  czyli dokładnie to, co dziś. Kto nic nie zmieni, nie zobaczy różnicy.
- Edycja:
  - na podglądzie banera, jak na plakatach (`PosterText`, pasek formatowania),
    z nazwą koła jako wartością zastępczą;
  - w formularzu banera (zakładka „Treść” w trybie „Baner”): pole „Tekst banera”
    z nazwą koła jako podpowiedzią.
- Rozmiar: jak dziś nazwa koła w danym układzie; suwak „Rozmiar tytułu” działa
  tak jak teraz.

### Data, godzina i miejsce

- Wartości **wspólne z plakatem**: te same pola `event_date`, `event_time`,
  `location`. Wpisuje się je raz.
- Na banerze pokazują się tylko po włączeniu nowego przełącznika
  **`bannerShowEvent`** („Pokaż datę i miejsce”), **domyślnie wyłączonego** —
  okładka strony zostaje czysta.
- Ikona oka (widoczność pól) dotyczy plakatu i na banerze nic nie zmienia —
  o banerze decyduje tylko przełącznik.
- Po włączeniu przełącznika formularz banera pokazuje pola daty, godziny i
  miejsca (te same wartości co w trybie plakatu).
- Na banerze: puste pole **nie pokazuje się wcale** (bez wartości
  przykładowych, w przeciwieństwie do plakatów). Pokazują się tylko wypełnione
  części, połączone separatorem ` · ` (jak `InfoLine`); bez żadnej — linii nie ma.
- Miejsce jest edytowalne na podglądzie banera (to samo pole co na plakacie —
  zmiana widać też na plakacie). Data i godzina — tylko z formularza, jak na
  plakatach.

### Zakres

- Wszystkie 10 układów banerów (`src/posters/banners/Banner*.tsx`), w obu
  kształtach (okładka strony i wydarzenia).
- Znika podpowiedź w `FormBanner`, że pola wydarzenia dotyczą tylko trybu
  „Social media i druk”.
- Nowe pola trafiają do snapshotu (szkic, projekt, historia); stare zapisy
  dostają wartości domyślne (`''`, `false`). `isBlank` uwzględnia `bannerTitle`.
- Eksport PNG/PDF banera, miniatury i historia pokazują to samo co podgląd.

## Czego nie robimy

- Brak osobnej daty/miejsca dla banera — wartości są wspólne z plakatem.
- Brak prelegenta, podtytułu i plakietki na banerze.
- Brak zmian w układach plakatów.

## Czego nie zepsuć

- Bez zmian w formularzu baner wygląda **dokładnie jak dziś** (testy HTML
  banerów przy pustych danych mają przejść bez aktualizacji migawek; zmiana
  migawki jest dopuszczalna tylko wtedy, gdy nie zmienia wyglądu — np.
  dodatkowe atrybuty edycji w trybie edycji).
- Tekst musi się mieścić w bezpiecznej kolumnie banera (`BANNER_SAFE_W` =
  1096 px — tyle widać na telefonie z okładki strony).

## Decyzje zostawione wykonawcy

- Dokładne miejsce linii z datą w każdym układzie — domyślnie tuż pod dużym
  tekstem, stylem jak tekst informacyjny na plakatach (`typography.body`,
  skalowany suwakiem „Rozmiar pozostałego tekstu”); tam, gdzie układ ma inne
  naturalne miejsce (np. obok logotypów), wolno je wybrać, byle spójnie.
- Format daty — jak na plakatach w linii informacji (np. „27 lis”,
  `getDay`/`getMonthShort` z językiem plakatu).
- Nazwa pliku eksportu banera: jeśli `bannerTitle` jest wypełniony, może być
  podstawą nazwy (czysty tekst, `toPlain`); inaczej jak dziś.
- Długi tekst, który się nie mieści: wystarczy zachowanie jak dziś przy nazwie
  koła (zawijanie, suwak rozmiaru); automatyczne dopasowanie nie jest wymagane.

## Rozstrzygnięte przy przeglądzie (decyzje autora projektu)

- `bannerTitle` może mieć łamania wierszy i formatowanie: rysuje go
  `PosterText` z tymi samymi stylami kontenera, które ma dziś nazwa koła
  (np. `textWrap: balance`, `maxWidth`) — bez nowych reguł.
- W układach o ciasnym pionie (np. `BannerGala` na okładce strony 624 px) linia
  z datą może dopychać treść do krawędzi: sprawdzić każdy układ na podglądzie
  w obu kształtach i w razie potrzeby zmniejszyć odstępy.
