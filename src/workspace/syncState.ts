import type { ProjectRow } from '../projects/remoteProjects'
import { isBlank } from '../snapshot/snapshot'
import type { EditorSnapshot } from '../snapshot/snapshot'

// Czysta logika kopii roboczej: bez Reacta, sieci i IndexedDB. Tu zapadają
// decyzje, od których zależy, czy czyjaś praca nie zostanie nadpisana -
// dlatego każda jest funkcją z pełną tabelą przypadków w teście.

// Projekt w chmurze, do którego przypięta jest kopia robocza.
export interface ProjectBinding {
  id: number
  name: string
  // Właściciel (auth.uid) - tylko on może zapisywać.
  ownerId: string
  // Wersja wiersza, którą ta kopia ostatnio wczytała albo zapisała.
  revision: number
}

// Lokalna kopia robocza (IndexedDB, klucz `sknm-workspace`).
export interface Workspace {
  snapshot: EditorSnapshot
  // `null` = wersja robocza bez projektu w chmurze.
  project: ProjectBinding | null
  // Przypięta: są zmiany, których nie ma w chmurze. Wersja robocza: są zmiany
  // od otwarcia (o ich porzucenie trzeba zapytać).
  dirty: boolean
}

export const bindingOf = (row: ProjectRow): ProjectBinding => ({ id: row.id, name: row.name, ownerId: row.owner, revision: row.revision })

// --- Status zapisu pokazywany w pasku projektu ---

// `local`    - wersja robocza, tylko na tym urządzeniu;
// `saved`    - projekt zgodny z chmurą;
// `dirty`    - zmiany czekają na autozapis;
// `saving`   - trwa żądanie zapisu;
// `error`    - ostatni zapis się nie udał (zostanie ponowiony);
// `conflict` - w chmurze jest nowsza wersja; autozapis stoi do decyzji użytkownika;
// `paused`   - projekt przypięty, ale nikt uprawniony nie jest zalogowany.
export type SaveStatus = 'local' | 'saved' | 'dirty' | 'saving' | 'error' | 'conflict' | 'paused'

export type SaveEvent =
  // Wczytano stan do edytora (start, otwarcie projektu, nowy projekt).
  | { type: 'opened'; bound: boolean; dirty: boolean; online: boolean }
  | { type: 'edited' }
  | { type: 'saveStarted' }
  // `dirty` - w trakcie żądania doszły kolejne zmiany.
  | { type: 'saveSucceeded'; dirty: boolean }
  // `bound: false` - nie udało się utworzyć projektu (pierwszy zapis).
  | { type: 'saveFailed'; bound: boolean }
  | { type: 'conflict' }
  | { type: 'paused' }
  | { type: 'resumed'; dirty: boolean }
  | { type: 'unbound' }

export function reduceSaveStatus(status: SaveStatus, event: SaveEvent): SaveStatus {
  switch (event.type) {
    case 'opened':
      if (!event.bound) return 'local'
      if (!event.online) return 'paused'
      return event.dirty ? 'dirty' : 'saved'
    case 'unbound':
      return 'local'
    case 'edited':
      // Tylko `saved` ma co stracić; `error` zostaje widoczny do następnej próby.
      return status === 'saved' ? 'dirty' : status
    case 'saveStarted':
      return 'saving'
    case 'saveSucceeded':
      // Wynik żądania, na które nikt już nie czeka (wstrzymanie, konflikt), nie zmienia statusu.
      if (status !== 'saving') return status
      return event.dirty ? 'dirty' : 'saved'
    case 'saveFailed':
      if (status !== 'saving') return status
      return event.bound ? 'error' : 'local'
    case 'conflict':
      return status === 'local' || status === 'paused' ? status : 'conflict'
    case 'paused':
      return status === 'local' ? 'local' : 'paused'
    case 'resumed':
      if (status !== 'paused') return status
      return event.dirty ? 'dirty' : 'saved'
  }
}

// --- Zmiana zalogowanej osoby ---

// `none`   - wersja robocza, logowanie niczego nie zmienia;
// `resume` - zalogowany właściciel: synchronizacja działa;
// `pause`  - nikt nie jest zalogowany: przypięcie zostaje, zapis czeka;
// `unbind` - zalogował się ktoś inny: treść zostaje jako wersja robocza.
export type BindingAction = 'none' | 'resume' | 'pause' | 'unbind'

// Co zrobić z kopią roboczą, gdy znamy zalogowaną osobę (`null` = nikt).
// Zwraca też kopię po tej decyzji. Jawne „Wyloguj" idzie przez `afterSignOut`.
export function reconcileBinding(workspace: Workspace, userId: string | null): { action: BindingAction; workspace: Workspace } {
  if (!workspace.project) return { action: 'none', workspace }
  if (userId === null) return { action: 'pause', workspace }
  if (userId === workspace.project.ownerId) return { action: 'resume', workspace }
  // Cudzego projektu nie wolno zapisywać ani po cichu wyrzucić - zostaje
  // niezapisana wersja robocza.
  return { action: 'unbind', workspace: { ...workspace, project: null, dirty: true } }
}

// Jawne wylogowanie. `flushed` - czy przed wylogowaniem udało się zapisać
// projekt w chmurze.
// `keep`   - wersja robocza zostaje, jak była;
// `blank`  - projekt jest bezpieczny w chmurze: pusty edytor;
// `detach` - zapis się nie udał: treść zostaje na urządzeniu jako wersja robocza.
export type SignOutOutcome = 'keep' | 'blank' | 'detach'

export function afterSignOut(workspace: Workspace, flushed: boolean): SignOutOutcome {
  if (!workspace.project) return 'keep'
  return flushed ? 'blank' : 'detach'
}

// --- Porównanie kopii lokalnej z wierszem w chmurze ---

// `keep`        - nic do wysłania ani wczytania: ta sama wersja bez lokalnych
//                 zmian albo ta sama treść (zapis doszedł, ale odpowiedź nie -
//                 zamknięta karta, zerwane połączenie); kopia przyjmuje `revision`;
// `applyRemote` - w chmurze jest nowsza wersja, lokalnie nic nie zmieniono;
// `push`        - lokalne zmiany na wersji, którą chmura nadal ma;
// `conflict`    - lokalne zmiany, a chmura poszła dalej;
// `drop`        - wiersza nie ma (usunięty, cudzy): zostaje wersja robocza.
// `name` - bieżąca nazwa z chmury (projekt mógł zostać przemianowany gdzie indziej).
export type BootDecision =
  | { kind: 'keep'; name: string; revision: number }
  | { kind: 'applyRemote'; row: ProjectRow }
  | { kind: 'push'; name: string }
  | { kind: 'conflict'; name: string }
  | { kind: 'drop' }

// Kopia lokalna bez przypięcia nie ma czego porównywać - wołający pyta tylko
// o przypięte; dla porządku odpowiedź to `drop` (zostaje wersja robocza).
export function bootDecision(local: Workspace, remoteRow: ProjectRow | null): BootDecision {
  const { project } = local
  if (!project || !remoteRow) return { kind: 'drop' }
  if (remoteRow.id !== project.id || remoteRow.owner !== project.ownerId) return { kind: 'drop' }
  const { name, revision } = remoteRow
  const sameRevision = revision === project.revision
  if ((sameRevision && !local.dirty) || sameContent(local.snapshot, remoteRow.snapshot)) return { kind: 'keep', name, revision }
  if (local.dirty) return { kind: sameRevision ? 'push' : 'conflict', name }
  return { kind: 'applyRemote', row: remoteRow }
}

// --- Zastąpienie bieżącej treści innym dokumentem ---

// Czy przed zastąpieniem treści trzeba zapytać użytkownika. Pytamy tylko
// o niezapisaną, niepustą wersję roboczą (projekt idzie do chmury osobną
// drogą). `consentedTo` - treść, na której porzucenie użytkownik już się
// zgodził: zgoda nie obejmuje niczego, co dopisał później, np. w czasie
// pobierania otwieranego projektu.
export function discardNeedsConsent(workspace: Workspace | null, consentedTo: EditorSnapshot | null): boolean {
  if (!workspace || workspace.project || !workspace.dirty || isBlank(workspace.snapshot)) return false
  return consentedTo === null || !sameContent(workspace.snapshot, consentedTo)
}

// JSON z kluczami w stałej kolejności: jsonb z bazy wraca z kluczami
// poukładanymi inaczej, niż je wysłano.
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).filter((key) => record[key] !== undefined).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

// Czy wiersz w chmurze trzyma dokładnie ten snapshot.
export function sameContent(snapshot: EditorSnapshot, remote: unknown): boolean {
  return stableJson(snapshot) === stableJson(remote)
}

// Krótki opis problemu z zapisem (tylko `error` i `conflict`); rozwiązanie
// (ponowienie, wybór wersji) jest w pasku projektu w edytorze.
export function saveProblem(status: SaveStatus): string | null {
  if (status === 'error') return 'Nie udało się zapisać projektu — ponowimy próbę.'
  if (status === 'conflict') return 'Projekt został zmieniony w innym miejscu — wybierz w edytorze, którą wersję zachować.'
  return null
}
