# Dokumentacja projektu

Generator grafik wydarzeń SKNM - aplikacja React + Vite + TypeScript (PWA),
renderująca plakaty 1080×1080 i eksportująca je do PNG przez `html-to-image`.

## Spis treści

- [architektura.md](./architektura.md) - jak to jest poskładane (warstwy, przepływ danych, baza)
- [stylowanie.md](./stylowanie.md) - Tailwind CSS w UI aplikacji + dlaczego plakaty mają style inline
- [dodawanie-szablonu.md](./dodawanie-szablonu.md) - krok po kroku: nowy layout plakatu
- [dodawanie-schematu-kolorow.md](./dodawanie-schematu-kolorow.md) - krok po kroku: nowy schemat kolorów ("motyw") dla istniejącego layoutu

## Szybki start

```bash
npm install
npm run dev        # http://localhost:5173/sknm-image-generator/
npm run build      # typecheck (tsc) + build produkcyjny
npm test           # vitest
npm run lint       # oxlint
```

Podgląd pojedynczego szablonu z danymi przykładowymi (routing po ścieżce
w `src/main.tsx`): `<BASE_URL>poster/<poster_key>` lub
`<BASE_URL>poster/<poster_key>/<scheme>`, np. w dev:
`http://localhost:5173/sknm-image-generator/poster/wyklad/czernZolta`.
