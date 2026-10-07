export type EditorTab = 'template' | 'content' | 'look'

export const EDITOR_TABS: readonly { tab: EditorTab; label: string }[] = [
  { tab: 'template', label: 'Szablon' },
  { tab: 'content', label: 'Treść' },
  { tab: 'look', label: 'Wygląd' },
]

export const EDITOR_TAB_STORAGE_KEY = 'sknm-editor-tab'

// Odczyt aktywnej zakładki edytora z localStorage. Cokolwiek nieoczekiwanego
// (brak wpisu, nieznana wartość) → zakładka „Szablon".
export function parseEditorTab(raw: unknown): EditorTab {
  return EDITOR_TABS.find(t => t.tab === raw)?.tab ?? 'template'
}

// Stała referencja - pasuje do `useStoredState` (zależność efektu zapisu).
export function serializeEditorTab(tab: EditorTab): string {
  return tab
}
