# Wersje kolorystyczne: złoto/srebro okazjonalne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doprowadzić schematy kolorów do zasady „złoto tylko z sygnetem `zloty`, srebro tylko z sygnetem `srebrny`", dodać schematy „Okazjonalny złoty" / „Okazjonalny srebrny" i trzy warianty „Czerń" (żółty/pomarańczowy/granatowy akcent) tam, gdzie dziś złoto łamie zasadę.

**Architecture:** Cała logika kolorów siedzi w `src/posters/schemes.ts` (zagnieżdżone bloki per layout, resolver scala nazwany schemat nad blokiem bazowym). Zmiana jest deklaratywna: przebudowa bloków + `SCHEME_LABELS`, plus nowy token `colors.silver`, nowy sygnet SVG i rozszerzenie typu `SygnetName`. Komponenty plakatów czytają role przez `var(--*)` i nie wymagają zmian (poza jedną linią w `PosterGala.tsx`). Reset wersji schematu SQLite czyści zdezaktualizowane klucze w zapisanym draftcie/historii.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest, oxlint, sql.js (SQLite w przeglądarce), SVG jako importowane assety Vite.

**Spec:** `docs/superpowers/specs/2026-08-31-kolory-okazjonalne-design.md`

## Global Constraints

- Odpowiedzi i komentarze po polsku, z pełną ortografią (ś, ż, ó, ł, ą, ę, ń).
- Klucze schematów: camelCase, **ASCII** (`czernZolta`, nie `czernŻółta`). Etykiety w `SCHEME_LABELS`: polska ortografia.
- `colors.silver` = `'#C6C7CB'` (dokładnie ta wartość).
- Wypełnienie `sygnet_srebrny.svg` = `#c6c7cb` (zgodne z `colors.silver`).
- Zasada niezmienna: schemat z wartością CSS `=== colors.gold` musi mieć `sygnet === 'zloty'`; z `=== colors.silver` — `sygnet === 'srebrny'`.
- „Granatowy akcent" na ciemnym tle = `colors.navyLight` (`#4A54B4`); na jasnym = `colors.navy`.
- Każdy nowy schemat ustawia `logoVariant` jawnie (nie polegać na dziedziczeniu, gdy blok bazowy layoutu ma inny wariant).
- Po zmianie: `npm test`, `npm run typecheck`, `npm run lint` — wszystkie zielone.
- Commity częste, po polsku, zakończone stopką:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q
  ```
- Branch roboczy: `kolory-okazjonalne` (już utworzony z `main`).

---

## Stan wyjściowy — czego dotykamy

Plik `src/posters/schemes.ts` ma 8 bloków layoutów. Naruszenia (złoto + sygnet ≠ `zloty`):

| Layout | dziś klucz `czern` | rola z `colors.gold` |
|---|---|---|
| `ogloszenie` | tak | `accent` |
| `gosc` | tak | `accent` |
| `wyklad` | tak | `badgeFill`, `speaker`, `chips` |
| `konferencja` | tak | `headerBadge`, `lineFirst`, `footerBadge` |
| `rekrutacja` | tak (`band`) + `zloto` (`pageBg`!) | `band` / `pageBg` |
| `warsztat` | tak | `badgeFill`, `pillFill` |

`data.czern` jest czysta (trójkąty `lime`/`coral`/`cream`) — zostaje. `data.zloto`, `gala`, `*.zloto` (reszta) są zgodne.

## File Structure

| Plik | Odpowiedzialność | Zmiana |
|---|---|---|
| `src/posters/theme.ts` | tokeny wizualne (`colors`, typografia, wymiary) | `+ colors.silver` |
| `src/types.ts` | typy współdzielone | `SygnetName += 'srebrny'` |
| `src/assets/brand/sknm/sygnet_srebrny.svg` | grafika sygnetu SKNM w srebrze | nowy plik |
| `src/posters/logos.ts` | mapowanie `SygnetName → URL assetu` | import + wpis |
| `src/posters/schemes.ts` | wszystkie schematy kolorów + etykiety | przebudowa 8 bloków + `SCHEME_LABELS` |
| `src/posters/schemes.test.ts` | testy resolvera i schematów | przepisane asercje + 2 invarianty |
| `src/posters/PosterGala.tsx` | render plakatu Gala | gradient: końce `rgba(...,0)` → `transparent` |
| `src/db/schema.ts` | wersja i kształt tabel SQLite | `SCHEMA_VERSION 3 → 4` + komentarz |

Bez zmian: pozostałe `Poster*.tsx`, formularze, `SchemeSelector.tsx`, `App.tsx`, `registry.ts`, `db/schema.test.ts`.

---

## Task 1: Fundament — token srebra, sygnet SVG, typ, rejestracja

**Files:**
- Modify: `src/posters/theme.ts` (obiekt `colors`, ok. linia 22 — po `gold`)
- Modify: `src/types.ts:81` (`SygnetName`)
- Create: `src/assets/brand/sknm/sygnet_srebrny.svg`
- Modify: `src/posters/logos.ts` (import + `sygnetByName`)
- Test: `src/posters/logos.test.ts` (nowy)

**Interfaces:**
- Produces:
  - `colors.silver: string` (`'#C6C7CB'`) w `src/posters/theme.ts`
  - `SygnetName` zawiera literał `'srebrny'`
  - `sygnetByName: Record<SygnetName, string>` ma klucz `srebrny` wskazujący na zaimportowany SVG
- Consumes: nic (pierwszy task)

- [ ] **Step 1: Wygeneruj `sygnet_srebrny.svg` z `sygnet_szary.svg`**

`sygnet_szary.svg` i `sygnet_zloty.svg` są identyczne poza kolorem wypełnienia (`sygnet_szary` ma jedno wystąpienie `#8a8d8f`). Utwórz srebrną kopię:

```bash
sed 's/#8a8d8f/#c6c7cb/' src/assets/brand/sknm/sygnet_szary.svg > src/assets/brand/sknm/sygnet_srebrny.svg
```

Sprawdź, że plik ma dokładnie jedno `#c6c7cb` i zero `#8a8d8f`:

```bash
grep -c '#c6c7cb' src/assets/brand/sknm/sygnet_srebrny.svg   # 1
grep -c '#8a8d8f' src/assets/brand/sknm/sygnet_srebrny.svg   # 0
```

- [ ] **Step 2: Napisz failfor test (`src/posters/logos.test.ts`)**

```ts
import { describe, expect, it } from 'vitest'
import { sygnetByName } from './logos'
import type { SygnetName } from '../types'

describe('sygnetByName', () => {
  it('ma wpis dla każdej nazwy sygnetu, w tym srebrny', () => {
    const names: SygnetName[] = ['negatywny', 'granat', 'zloty', 'szary', 'czarny', 'srebrny']
    for (const n of names) {
      expect(sygnetByName[n], `brak sygnetu: ${n}`).toBeTruthy()
      expect(typeof sygnetByName[n]).toBe('string')
    }
  })

  it('srebrny to inny plik niż szary i zloty', () => {
    expect(sygnetByName.srebrny).not.toBe(sygnetByName.szary)
    expect(sygnetByName.srebrny).not.toBe(sygnetByName.zloty)
  })
})
```

- [ ] **Step 3: Uruchom test — ma nie skompilować / paść**

Run: `npx vitest run src/posters/logos.test.ts`
Expected: FAIL — `SygnetName` nie ma `'srebrny'` (błąd typu) oraz `sygnetByName.srebrny` niezdefiniowane.

- [ ] **Step 4: Dodaj `colors.silver` w `src/posters/theme.ts`**

W obiekcie `colors`, bezpośrednio po linii `gold: '#84754E',`:

```ts
  gold: '#84754E',
  silver: '#C6C7CB',
```

- [ ] **Step 5: Rozszerz `SygnetName` w `src/types.ts`**

```ts
export type SygnetName = 'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny' | 'srebrny'
```

- [ ] **Step 6: Zarejestruj sygnet w `src/posters/logos.ts`**

Dodaj import obok pozostałych:

```ts
import sygnetSrebrny from '../assets/brand/sknm/sygnet_srebrny.svg'
```

i wpis w `sygnetByName` (na końcu obiektu):

```ts
export const sygnetByName: Record<SygnetName, string> = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
  srebrny: sygnetSrebrny,
}
```

- [ ] **Step 7: Uruchom test — ma przejść**

Run: `npx vitest run src/posters/logos.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: bez błędów.

- [ ] **Step 9: Commit**

```bash
git add src/posters/theme.ts src/types.ts src/posters/logos.ts src/posters/logos.test.ts src/assets/brand/sknm/sygnet_srebrny.svg
git commit -m "Sygnet srebrny + token colors.silver

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q"
```

---

## Task 2: Przebudowa `schemes.ts` — bloki layoutów + etykiety

Najbardziej obszerny task. Cała treść bloków jest w specu (sekcja „`src/posters/schemes.ts` — bloki layoutów"). Tu podane w całości.

**Files:**
- Modify: `src/posters/schemes.ts` (bloki `ogloszenie`, `gala`, `gosc`, `data`, `wyklad`, `konferencja`, `rekrutacja`, `warsztat`; `SCHEME_LABELS`)
- Modify: `src/posters/PosterGala.tsx:24` (gradient)
- Test: `src/posters/schemes.test.ts` (przepisany)

**Interfaces:**
- Consumes: `colors.silver`, `SygnetName` z `'srebrny'` (Task 1)
- Produces:
  - `schemes.ogloszenie` klucze: `default, czernZolta, czernPomaranczowa, czernGranatowa, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`
  - `schemes.gosc` klucze: jw. (bez `gala`)
  - `schemes.wyklad` klucze: `default, czernZolta, czernPomaranczowa, czernGranatowa, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`
  - `schemes.konferencja` klucze: jw.
  - `schemes.warsztat` klucze: jw.
  - `schemes.rekrutacja` klucze: `limonka, czernZolta, czernPomaranczowa, czernGranatowa, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`
  - `schemes.data` klucze: `default, czern, okazjonalnyZloty, okazjonalnySrebrny, jasny, szary`
  - `schemes.gala` klucze: `okazjonalnyZloty, okazjonalnySrebrny`
  - `SCHEME_LABELS` bez `zloto` i `gala`; z `czernZolta`, `czernPomaranczowa`, `czernGranatowa`, `okazjonalnyZloty`, `okazjonalnySrebrny`
  - `resolveScheme`, `schemesFor`, `SCHEME_LABELS` — sygnatury bez zmian

- [ ] **Step 1: Przepisz `src/posters/schemes.test.ts` na nowe klucze (test najpierw)**

Zastąp cały blok `describe('resolveScheme', ...)` poniższym. To jest test docelowy — po Step 1 **poleci** (bloki jeszcze stare).

```ts
import { describe, expect, it } from 'vitest'
import { SCHEME_LABELS, resolveScheme, schemes, schemesFor } from './schemes'
import { colors } from './theme'

describe('resolveScheme', () => {
  it('nieznany layout/schemat → pusty wynik', () => {
    const s = resolveScheme('nieistnieje', 'tez-nie')
    expect(s.cssVars).toEqual({})
    expect(s.sygnet).toBeUndefined()
    expect(s.logoVariant).toBeUndefined()
  })

  it('roleToVar: camelCase → --kebab, NON_CSS pomijane', () => {
    schemes.__probe = {
      default: { pageBg: '#000', badgeFill: '#111', wedgeBr: '#222', tri1: '#333', logoVariant: 'dark' },
    }
    const s = resolveScheme('__probe', undefined)
    expect(s.cssVars['--page-bg']).toBe('#000')
    expect(s.cssVars['--badge-fill']).toBe('#111')
    expect(s.cssVars['--wedge-br']).toBe('#222')
    expect(s.cssVars['--tri1']).toBe('#333')
    expect(s.cssVars['--logo-variant']).toBeUndefined()
    expect(s.logoVariant).toBe('dark')
    delete schemes.__probe
  })

  it('Ogłoszenie: czerń w trzech akcentach + okazjonalne', () => {
    const d = resolveScheme('ogloszenie', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.navy)
    expect(d.cssVars['--accent']).toBe(colors.lime)
    expect(d.sygnet).toBe('negatywny')

    const cz = resolveScheme('ogloszenie', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.lime)
    expect(cz.cssVars['--page-text']).toBe(colors.cream)  // z default
    expect(cz.sygnet).toBe('negatywny')
    expect(cz.logoVariant).toBe('dark')                   // z default

    expect(resolveScheme('ogloszenie', 'czernPomaranczowa').cssVars['--accent']).toBe(colors.coral)
    expect(resolveScheme('ogloszenie', 'czernGranatowa').cssVars['--accent']).toBe(colors.navyLight)

    const zl = resolveScheme('ogloszenie', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)     // z default
    expect(zl.cssVars['--accent']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('ogloszenie', 'okazjonalnySrebrny')
    expect(sr.cssVars['--accent']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Gala (dwa schematy)', () => {
    const d = resolveScheme('gala', undefined)
    expect(d.cssVars['--page-bg']).toBe(colors.ink)
    expect(d.cssVars['--gold']).toBe(colors.gold)
    expect(d.cssVars['--panel-br']).toBe(colors.inkPanel)
    expect(d.sygnet).toBe('zloty')

    const sr = resolveScheme('gala', 'okazjonalnySrebrny')
    expect(sr.cssVars['--gold']).toBe(colors.silver)    // rola --gold niesie srebro
    expect(sr.cssVars['--page-bg']).toBe(colors.ink)    // z bazy
    expect(sr.sygnet).toBe('srebrny')
    expect(sr.logoVariant).toBe('dark')
  })

  it('Gość: brak osobnego schematu gala; okazjonalne na tle ink', () => {
    const d = resolveScheme('gosc', undefined)
    expect(d.cssVars['--accent']).toBe(colors.navy)
    expect(d.sygnet).toBe('negatywny')
    expect(schemesFor('gosc')).not.toContain('gala')

    const cz = resolveScheme('gosc', 'czernPomaranczowa')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--accent']).toBe(colors.coral)
    expect(cz.cssVars['--muted-text']).toBe(colors.creamMuted)
    expect(cz.sygnet).toBe('negatywny')

    const zl = resolveScheme('gosc', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.ink)
    expect(zl.cssVars['--accent']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('gosc', 'okazjonalnySrebrny')
    expect(sr.cssVars['--accent']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Data: czerń bez zmian, dochodzi okazjonalny srebrny', () => {
    const d = resolveScheme('data', undefined)
    expect(d.cssVars['--page-text']).toBe(colors.navy)
    expect(d.cssVars['--tri2']).toBe(colors.lime)

    const cz = resolveScheme('data', 'czern')
    expect(cz.cssVars['--tri1']).toBe(colors.lime)
    expect(cz.sygnet).toBe('negatywny')

    const zl = resolveScheme('data', 'okazjonalnyZloty')
    expect(zl.cssVars['--tri1']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('data', 'okazjonalnySrebrny')
    expect(sr.cssVars['--tri1']).toBe(colors.silver)
    expect(sr.cssVars['--tri2']).toBe(colors.coral)
    expect(sr.sygnet).toBe('srebrny')
    expect(sr.logoVariant).toBe('dark')
  })

  it('Wykład: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('wyklad', undefined)
    expect(d.cssVars['--badge-fill']).toBe(colors.lime)
    expect(d.cssVars['--wedge-bl']).toBe(colors.navyDark)

    const cz = resolveScheme('wyklad', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--badge-fill']).toBe(colors.lime)
    expect(cz.cssVars['--wedge-br']).toBe('#1E1E1E')
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('wyklad', 'czernPomaranczowa').cssVars['--speaker']).toBe(colors.coral)
    expect(resolveScheme('wyklad', 'czernGranatowa').cssVars['--chips']).toBe(colors.navyLight)

    const zl = resolveScheme('wyklad', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.black)
    expect(zl.cssVars['--speaker']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('wyklad', 'okazjonalnySrebrny')
    expect(sr.cssVars['--badge-fill']).toBe(colors.silver)
    expect(sr.cssVars['--badge-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Konferencja: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('konferencja', undefined)
    expect(d.cssVars['--panel']).toBe(colors.navy)
    expect(d.cssVars['--line-rest']).toBe(colors.creamMuted)

    const cz = resolveScheme('konferencja', 'czernZolta')
    expect(cz.cssVars['--panel']).toBe(colors.inkPanel)
    expect(cz.cssVars['--header-badge']).toBe(colors.lime)
    expect(cz.cssVars['--line-rest']).toBe('rgba(244,242,237,.2)')
    expect(cz.cssVars['--panel-text']).toBe(colors.cream)   // z default
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('konferencja', 'czernPomaranczowa').cssVars['--footer-badge']).toBe(colors.coral)
    expect(resolveScheme('konferencja', 'czernGranatowa').cssVars['--line-first']).toBe(colors.navyLight)

    const zl = resolveScheme('konferencja', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)
    expect(zl.cssVars['--header-badge']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('konferencja', 'okazjonalnySrebrny')
    expect(sr.cssVars['--header-badge']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Rekrutacja (baza = limonka): trzy czernie + okazjonalne, bez pełnozłotego tła', () => {
    const li = resolveScheme('rekrutacja', 'limonka')
    expect(li.cssVars['--page-bg']).toBe(colors.lime)
    expect(li.cssVars['--band']).toBe(colors.navy)

    expect(schemesFor('rekrutacja')).not.toContain('zloto')

    const cz = resolveScheme('rekrutacja', 'czernZolta')
    expect(cz.cssVars['--page-bg']).toBe(colors.black)
    expect(cz.cssVars['--band']).toBe(colors.lime)
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('rekrutacja', 'czernPomaranczowa').cssVars['--band']).toBe(colors.coral)
    expect(resolveScheme('rekrutacja', 'czernGranatowa').cssVars['--band']).toBe(colors.navyLight)

    const zl = resolveScheme('rekrutacja', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.black)
    expect(zl.cssVars['--band']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('rekrutacja', 'okazjonalnySrebrny')
    expect(sr.cssVars['--band']).toBe(colors.silver)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('Warsztat: trzy czernie + okazjonalne', () => {
    const d = resolveScheme('warsztat', undefined)
    expect(d.cssVars['--pill-fill']).toBe(colors.lime)

    const cz = resolveScheme('warsztat', 'czernZolta')
    expect(cz.cssVars['--slot-bg']).toBe(colors.black)
    expect(cz.cssVars['--pill-fill']).toBe(colors.lime)
    expect(cz.cssVars['--qr-border']).toBe('rgba(244,242,237,.3)')
    expect(cz.sygnet).toBe('negatywny')

    expect(resolveScheme('warsztat', 'czernPomaranczowa').cssVars['--badge-fill']).toBe(colors.coral)
    expect(resolveScheme('warsztat', 'czernGranatowa').cssVars['--pill-fill']).toBe(colors.navyLight)

    const zl = resolveScheme('warsztat', 'okazjonalnyZloty')
    expect(zl.cssVars['--page-bg']).toBe(colors.navy)
    expect(zl.cssVars['--badge-fill']).toBe(colors.gold)
    expect(zl.sygnet).toBe('zloty')

    const sr = resolveScheme('warsztat', 'okazjonalnySrebrny')
    expect(sr.cssVars['--pill-fill']).toBe(colors.silver)
    expect(sr.cssVars['--pill-text']).toBe(colors.ink)
    expect(sr.sygnet).toBe('srebrny')
  })

  it('invariant: każdy layout ma niepustą listę schematów; każdy (z bazą włącznie) zwraca sygnet + logoVariant + niepusty cssVars', () => {
    for (const layout of Object.keys(schemes)) {
      const names = schemesFor(layout)
      expect(names.length, `${layout}: brak schematów`).toBeGreaterThan(0)
      for (const name of [undefined, ...names]) {
        const s = resolveScheme(layout, name)
        expect(s.sygnet, `${layout}/${name}: brak sygnet`).toBeTruthy()
        expect(['light', 'dark'], `${layout}/${name}: zły logoVariant`).toContain(s.logoVariant)
        expect(Object.keys(s.cssVars).length, `${layout}/${name}: pusty cssVars`).toBeGreaterThan(0)
      }
    }
  })

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
})

it('SCHEME_LABELS', () => {
  expect(SCHEME_LABELS.czern).toBe('Czerń')
  expect(SCHEME_LABELS.czernZolta).toBe('Czerń żółta')
  expect(SCHEME_LABELS.okazjonalnyZloty).toBe('Okazjonalny złoty')
  expect(SCHEME_LABELS.okazjonalnySrebrny).toBe('Okazjonalny srebrny')
  expect(SCHEME_LABELS.zloto).toBeUndefined()
})
```

- [ ] **Step 2: Uruchom testy — mają paść**

Run: `npx vitest run src/posters/schemes.test.ts`
Expected: FAIL (stare klucze `zloto`/`czern` w większości bloków, brak `czernZolta` itd.).

- [ ] **Step 3: Przebuduj blok `ogloszenie` w `src/posters/schemes.ts`**

```ts
const ogloszenie: LayoutSchemes = {
  default: { pageBg: colors.navy, pageText: colors.cream, accent: colors.lime,
             sygnet: 'negatywny', logoVariant: 'dark' },
  czernZolta:        { pageBg: colors.black, accent: colors.lime,      sygnet: 'negatywny' },
  czernPomaranczowa: { pageBg: colors.black, accent: colors.coral,     sygnet: 'negatywny' },
  czernGranatowa:    { pageBg: colors.black, accent: colors.navyLight, sygnet: 'negatywny' },
  okazjonalnyZloty:   { accent: colors.gold,   sygnet: 'zloty' },
  okazjonalnySrebrny: { accent: colors.silver, sygnet: 'srebrny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText, accent: colors.navy,
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark,
           sygnet: 'szary', logoVariant: 'light' },
}
```

- [ ] **Step 4: Przebuduj blok `gala`**

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

- [ ] **Step 5: Przebuduj blok `gosc` (usuń klucz `gala`)**

```ts
const gosc: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
             accent: colors.navy, sygnet: 'negatywny', logoVariant: 'light' },
  czernZolta:        { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.lime,      sygnet: 'negatywny', logoVariant: 'dark' },
  czernPomaranczowa: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.coral,     sygnet: 'negatywny', logoVariant: 'dark' },
  czernGranatowa:    { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
                       accent: colors.navyLight, sygnet: 'negatywny', logoVariant: 'dark' },
  okazjonalnyZloty:   { pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted,
                        accent: colors.gold,   sygnet: 'zloty',   logoVariant: 'dark' },
  okazjonalnySrebrny: { pageBg: colors.ink, pageText: colors.paper, mutedText: colors.creamMuted,
                        accent: colors.silver, sygnet: 'srebrny', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, accent: colors.grayDark },
}
```

- [ ] **Step 6: Przebuduj blok `data` (czerń bez zmian, `zloto` → `okazjonalnyZloty`, dodaj `okazjonalnySrebrny`)**

```ts
const data: LayoutSchemes = {
  default: { pageBg: colors.cream, pageText: colors.navy, mutedText: colors.textMuted,
             title: colors.ink, tri1: colors.navy, tri2: colors.lime, tri3: colors.coral,
             sygnet: 'granat', logoVariant: 'light' },
  czern: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.lime, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'negatywny', logoVariant: 'dark' },
  okazjonalnyZloty: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.gold, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'zloty', logoVariant: 'dark' },
  okazjonalnySrebrny: { pageBg: colors.black, pageText: colors.cream, mutedText: colors.creamMuted,
           title: colors.cream, tri1: colors.silver, tri2: colors.coral, tri3: colors.cream,
           sygnet: 'srebrny', logoVariant: 'dark' },
  jasny: { pageBg: colors.paper },
  szary: { pageBg: colors.paper, pageText: colors.slate, title: colors.slate,
           tri1: colors.grayDark, tri2: colors.gray, sygnet: 'szary' },
}
```

- [ ] **Step 7: Przebuduj blok `wyklad`**

```ts
const wyklad: LayoutSchemes = {
  default: {
    pageBg: colors.navy, pageText: colors.cream,
    badgeFill: colors.lime, badgeText: colors.limeText,
    speaker: colors.lime, chips: colors.lime,
    washTop: 'rgba(255,255,255,.055)', wedgeBr: colors.navyLight, wedgeBl: colors.navyDark,
    sygnet: 'negatywny', logoVariant: 'dark',
  },
  czernZolta: { pageBg: colors.black, badgeFill: colors.lime, badgeText: colors.limeText,
           speaker: colors.lime, chips: colors.lime,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  czernPomaranczowa: { pageBg: colors.black, badgeFill: colors.coral, badgeText: colors.cream,
           speaker: colors.coral, chips: colors.coral,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  czernGranatowa: { pageBg: colors.black, badgeFill: colors.navyLight, badgeText: colors.cream,
           speaker: colors.navyLight, chips: colors.navyLight,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'negatywny' },
  okazjonalnyZloty: { pageBg: colors.black, badgeFill: colors.gold, badgeText: colors.cream,
           speaker: colors.gold, chips: colors.gold,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'zloty' },
  okazjonalnySrebrny: { pageBg: colors.black, badgeFill: colors.silver, badgeText: colors.ink,
           speaker: colors.silver, chips: colors.silver,
           washTop: 'rgba(255,255,255,.04)', wedgeBr: '#1E1E1E', wedgeBl: '#0A0A0A',
           sygnet: 'srebrny' },
  jasny: { pageBg: colors.cream, pageText: colors.limeText,
           badgeFill: colors.navy, badgeText: colors.cream, speaker: colors.navy, chips: colors.navy,
           washTop: 'rgba(60,69,155,.05)', wedgeBr: '#E2DED3', wedgeBl: '#DAD5C8',
           sygnet: 'granat', logoVariant: 'light' },
  szary: { pageBg: colors.paper, pageText: colors.slate,
           badgeFill: colors.grayDark, badgeText: colors.cream, speaker: colors.grayDark, chips: colors.gray,
           washTop: 'rgba(138,141,143,.08)', wedgeBr: '#D8D4CA', wedgeBl: '#CFCAC0',
           sygnet: 'szary', logoVariant: 'light' },
}
```

> `default` `wyklad` ma `logoVariant: 'dark'` → warianty `czern*`/`okazjonalny*` dziedziczą `dark` (tło czarne). Nie nadpisujemy.

- [ ] **Step 8: Przebuduj blok `konferencja`**

```ts
const konferencja: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    panel: colors.navy, panelText: colors.cream, headerBadge: colors.lime,
    lineFirst: colors.navy, lineRest: colors.creamMuted, footerBadge: colors.navy,
    sygnet: 'negatywny', logoVariant: 'light',
  },
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
  okazjonalnyZloty: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.gold,
    lineFirst: colors.gold, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.gold,
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    panel: colors.inkPanel, headerBadge: colors.silver,
    lineFirst: colors.silver, lineRest: 'rgba(244,242,237,.2)', footerBadge: colors.silver,
    sygnet: 'srebrny', logoVariant: 'dark',
  },
  jasny: { pageBg: colors.paper },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    panel: colors.grayDark, headerBadge: colors.cream,
    lineFirst: colors.grayDark, footerBadge: colors.grayDark,
    sygnet: 'szary',
  },
}
```

- [ ] **Step 9: Przebuduj blok `rekrutacja` (usuń `zloto`; `czern` → trzy warianty + okazjonalne na czarnym tle)**

```ts
const rekrutacja: LayoutSchemes = {
  limonka: {
    pageBg: colors.lime, pageText: colors.limeText,
    band: colors.navy, subColor: colors.navyDark, footerText: colors.cream,
    badgeColor: colors.lime,
    qrBorder: 'rgba(244,242,237,.55)', qrText: 'rgba(244,242,237,.75)',
    sygnet: 'granat', logoVariant: 'dark',
  },
  czernZolta: {
    pageBg: colors.black, pageText: colors.cream,
    band: colors.lime, subColor: colors.creamMuted, footerText: colors.limeText,
    badgeColor: colors.black,
    qrBorder: 'rgba(18,18,18,.4)', qrText: 'rgba(18,18,18,.6)',
    sygnet: 'negatywny', logoVariant: 'light',
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
  jasny: {
    pageBg: colors.paper, pageText: colors.navy,
    subColor: colors.textMuted, badgeColor: colors.lime,
    sygnet: 'granat',
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    band: colors.grayDark, subColor: colors.textMuted, badgeColor: colors.cream,
    sygnet: 'szary',
  },
}
```

> `baseBlock` bierze pierwszy klucz, gdy layout nie ma `default`. Pierwszym kluczem musi zostać `limonka` — nie przenosić go. Zaktualizuj też komentarz przy końcu bloku, jeśli wymienia stare klucze (`zloto`).

- [ ] **Step 10: Przebuduj blok `warsztat`**

```ts
const warsztat: LayoutSchemes = {
  default: {
    pageBg: colors.cream, pageText: colors.ink, mutedText: colors.textMuted,
    title: colors.navy, badgeFill: colors.navy, badgeText: colors.lime,
    pillFill: colors.lime, pillText: colors.limeText, slotBg: colors.cream,
    qrBorder: colors.placeholderBorder, qrText: colors.placeholderText,
    sygnet: 'granat', logoVariant: 'light',
  },
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
  okazjonalnyZloty: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.gold, badgeText: colors.ink,
    pillFill: colors.gold, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'zloty', logoVariant: 'dark',
  },
  okazjonalnySrebrny: {
    pageBg: colors.navy, pageText: colors.cream, mutedText: colors.creamMuted,
    title: colors.cream, badgeFill: colors.silver, badgeText: colors.ink,
    pillFill: colors.silver, pillText: colors.ink, slotBg: colors.navy,
    qrBorder: 'rgba(244,242,237,.3)', qrText: 'rgba(244,242,237,.7)',
    sygnet: 'srebrny', logoVariant: 'dark',
  },
  jasny: {
    pageBg: colors.paper, slotBg: colors.paper,
  },
  szary: {
    pageBg: colors.paper, pageText: colors.slate,
    title: colors.slate, badgeFill: colors.grayDark, badgeText: colors.cream,
    pillFill: colors.gray, pillText: colors.slate, slotBg: colors.paper,
    sygnet: 'szary',
  },
}
```

- [ ] **Step 11: Zaktualizuj `SCHEME_LABELS`**

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

- [ ] **Step 12: Popraw gradient w `src/posters/PosterGala.tsx` (linia ~24)**

Było:

```tsx
<div style={{ position: 'absolute', top: 232, left: 0, right: 0, height: 1, background: `linear-gradient(to right, rgba(132,117,78,0) 0, var(--gold) 18%, var(--gold) 82%, rgba(132,117,78,0) 100%)` }} />
```

Ma być:

```tsx
<div style={{ position: 'absolute', top: 232, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent 0, var(--gold) 18%, var(--gold) 82%, transparent 100%)` }} />
```

- [ ] **Step 13: Zaktualizuj komentarze w `schemes.ts`**

Komentarze nad blokami wymieniające stare klucze/zachowania:
- nad `ogloszenie` / `gala` (linia ~12–19): wzmianka „każdy layout ma pełny blok `default`" — Gala nie ma już `default`, ma `okazjonalnyZloty` jako pierwszy/bazowy; dostosuj.
- nad `wyklad` (linia ~78–81): „Wariant czerń bierze sygnet negatywny (nie złoty), a złoto NIE nadpisuje `pageBg`" — przeredaguj pod nowe klucze (`czernZolta/Pomaranczowa/Granatowa` = negatyw; `okazjonalnyZloty` = czarne tło + złoty sygnet).
- nad `rekrutacja` (linia ~142–150 i ~182–183): usuń wzmiankę o `zloto`; „`zloto`/`jasny`/`szary`" → „`czern*`/`jasny`/`szary`".
- nad `data` (linia ~58–60): bez zmian sensu, ale `zloto` → `okazjonalnyZloty` jeśli wspomniane.

Trzymaj się stylu istniejących komentarzy (zwięźle, po polsku, po co dana rola).

- [ ] **Step 14: Uruchom testy schematów — mają przejść**

Run: `npx vitest run src/posters/schemes.test.ts`
Expected: PASS (wszystkie `it`, w tym oba invarianty).

- [ ] **Step 15: Typecheck + pełny test + lint**

Run: `npm run typecheck && npm test && npm run lint`
Expected: wszystko zielone.

- [ ] **Step 16: Commit**

```bash
git add src/posters/schemes.ts src/posters/schemes.test.ts src/posters/PosterGala.tsx
git commit -m "Schematy: okazjonalny złoty/srebrny + trzy warianty czerni, koniec złota z sygnetem negatywnym

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q"
```

---

## Task 3: Reset wersji schematu SQLite

Klucze `zloto`, `gala` (dla `gosc`), oraz `czern` w 6 layoutach nie istnieją już jako schematy. Zapisany `draft.color_scheme` / `generated_images.color_scheme` mógłby wskazywać nieistniejący schemat (render spadłby do bloku bazowego — nie crash, ale mylące). Zgodnie z przyjętą w repo strategią: reset tabel przez podbicie wersji.

**Files:**
- Modify: `src/db/schema.ts:17-19` (komentarz + `SCHEMA_VERSION`)
- Test: `src/db/schema.test.ts` (sprawdź istniejące — czy asertuje konkretną wartość `SCHEMA_VERSION`)

**Interfaces:**
- Consumes: nic
- Produces: `SCHEMA_VERSION === 4`

- [ ] **Step 1: Sprawdź, czy `schema.test.ts` przypina wartość wersji**

Run: `grep -n "SCHEMA_VERSION\|user_version\|resetIfStale" src/db/schema.test.ts`
Jeśli jest asercja `expect(SCHEMA_VERSION).toBe(3)` lub test `resetIfStale` z wartością 3 — zaktualizuj do 4 w Step 3.

- [ ] **Step 2: Podbij `SCHEMA_VERSION` i komentarz w `src/db/schema.ts`**

```ts
// Podbijaj przy każdej zmianie kształtu tabel wymagającej świeżego startu.
// v3: kolumna draft.visibility (JSON widoczności pól tekstowych).
// v4: przemianowane klucze schematów kolorów (zloto→okazjonalnyZloty,
//     czern→czernZolta/…); stare wartości color_scheme w draftcie/historii
//     przestały pasować, więc czyścimy tabele.
export const SCHEMA_VERSION = 4
```

- [ ] **Step 3: Zaktualizuj `schema.test.ts`, jeśli Step 1 coś wykrył**

Podmień oczekiwaną wartość `3` → `4` w odpowiednich asercjach. Jeśli test tylko sprawdza mechanikę (`resetIfStale` zwraca `true` gdy zapisana wersja < bieżąca) bez stałej — zostaw.

- [ ] **Step 4: Testy DB**

Run: `npx vitest run src/db/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/schema.test.ts
git commit -m "DB schema v4: reset po przemianowaniu kluczy schematów kolorów

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q"
```

---

## Task 4: Weryfikacja końcowa + przegląd na żywo

**Files:** brak zmian kodu (chyba że przegląd wykryje problem — wtedy poprawka w `schemes.ts` / `sygnet_srebrny.svg` / `theme.ts`).

- [ ] **Step 1: Pełny zestaw kontroli**

Run: `npm run typecheck && npm test && npm run lint && npm run build`
Expected: wszystko zielone, build przechodzi.

- [ ] **Step 2: Uruchom aplikację**

Run: `npm run dev` (albo skorzystaj ze skilla `run`).

- [ ] **Step 3: Przejrzyj pasek kolorystyki każdego z 8 layoutów**

Dla każdego layoutu (Ogłoszenie, Gość, Wykład, Warsztat, Data, Konferencja, Rekrutacja, Gala) kliknij po kolei wszystkie swatche i sprawdź:

- **Trzy „Czerń"** (żółta / pomarańczowa / granatowa): czarne tło, akcent w odpowiednim kolorze, sygnet **biały (negatywny)**, logo PK czytelne.
- **Okazjonalny złoty**: sygnet **złoty**, złote akcenty.
- **Okazjonalny srebrny**: sygnet **srebrny**, srebrne akcenty; odcień srebra odróżnialny od szarości.
- **Gala**: pojawił się pasek z 2 swatchami (Okazjonalny złoty / Okazjonalny srebrny); linia-gradient pod nagłówkiem renderuje się w obu (końce zanikają do przezroczystości).
- **Rekrutacja**: logo PK czytelne na kolorowej/złotej/srebrnej bandzie stopki (jeśli ginie — zamień `logoVariant` w danym schemacie i powtórz).
- **czernGranatowa**: `navyLight` na czerni ma wystarczający kontrast (jeśli nie — do zgłoszenia użytkownikowi, ewentualna zmiana na jaśniejszy odcień).
- **Data**: „Czerń" nadal wielokolorowa (lime/coral/cream), „Okazjonalny srebrny" ma pierwszy trójkąt srebrny.

- [ ] **Step 4: Eksport kontrolny**

Wyeksportuj PNG dla 2–3 layoutów w schemacie „Okazjonalny srebrny" — sprawdź, że sygnet i akcenty wychodzą poprawnie (nie ma odwołań do niezaładowanego assetu).

- [ ] **Step 5: Zbierz uwagi z przeglądu**

Jeśli przegląd wykrył korekty (odcień srebra, `logoVariant` na bandzie Rekrutacji, kontrast `navyLight`): nanieś je w `schemes.ts` / `sygnet_srebrny.svg` / `theme.ts`, uruchom `npm test`, commit:

```bash
git commit -am "Korekty po przeglądzie: <opis>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012PMGNREmRTX2LiLpQzTm6q"
```

- [ ] **Step 6: Podsumowanie dla użytkownika**

Zbierz: co się zmieniło (lista schematów per layout), co wymaga jego decyzji (odcień srebra, ewentualne korekty kontrastu), i że lokalny draft/historia zostały zresetowane przy pierwszym uruchomieniu.

---

## Self-Review

**Spec coverage:**

| Sekcja specu | Task |
|---|---|
| `colors.silver` | Task 1 Step 4 |
| `sygnet_srebrny.svg` | Task 1 Step 1 |
| `SygnetName += 'srebrny'` | Task 1 Step 5 |
| `logos.ts` rejestracja | Task 1 Step 6 |
| Klucze i etykiety (`SCHEME_LABELS`) | Task 2 Step 11 |
| Blok `ogloszenie` | Task 2 Step 3 |
| Blok `gosc` (usuń `gala`) | Task 2 Step 5 |
| Blok `data` (+ srebrny, bez podziału czerni) | Task 2 Step 6 |
| Blok `wyklad` | Task 2 Step 7 |
| Blok `konferencja` | Task 2 Step 8 |
| Blok `rekrutacja` (usuń `zloto`) | Task 2 Step 9 |
| Blok `warsztat` | Task 2 Step 10 |
| Blok `gala` (1 → 2 schematy) | Task 2 Step 4 |
| `PosterGala.tsx` gradient | Task 2 Step 12 |
| Resolver bez zmian | (brak zadania — celowo) |
| Migracja bazy `SCHEMA_VERSION 3→4` | Task 3 |
| Testy: przepisane asercje + invariant zasady | Task 2 Step 1 |
| Weryfikacja + przegląd na żywo | Task 4 |

Brak luk.

**Placeholder scan:** Wszystkie bloki podane w całości z konkretnymi wartościami. Komentarze do aktualizacji (Task 2 Step 13) opisane co do lokalizacji i sensu — bez „TODO". Task 4 Step 5 warunkowy („jeśli przegląd wykrył") — to nie placeholder, to gałąź zależna od obserwacji.

**Type consistency:**
- `SygnetName` literały: `'negatywny' | 'granat' | 'zloty' | 'szary' | 'czarny' | 'srebrny'` — spójne w Task 1 (types.ts, logos.ts, logos.test.ts) i Task 2 (bloki używają tylko tych literałów).
- Klucze schematów: `czernZolta`, `czernPomaranczowa`, `czernGranatowa`, `okazjonalnyZloty`, `okazjonalnySrebrny`, `czern` (tylko `data`), `limonka` (tylko `rekrutacja`), `default`, `jasny`, `szary` — identyczne w blokach (Task 2 Steps 3–10), `SCHEME_LABELS` (Step 11) i testach (Step 1).
- `colors.silver` — jedna wartość `'#C6C7CB'` w Global Constraints, spec i Task 1.
- `resolveScheme(layoutKey, name)` / `schemesFor(layoutKey)` — sygnatury nietknięte, testy używają istniejących.
- `SchemeBlock` dopuszcza dowolne role (`[role: string]: string | undefined`) + `sygnet`/`logoVariant` — nowe role nie wprowadzane, wszystkie użyte już istnieją w dzisiejszych blokach.

Zgodne.
