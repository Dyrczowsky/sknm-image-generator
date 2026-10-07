import { describe, expect, it } from 'vitest'
import { EDITOR_TABS, EDITOR_TAB_STORAGE_KEY, parseEditorTab, serializeEditorTab } from './uiState'

describe('EDITOR_TABS', () => {
  it('ma trzy zakładki z polskimi etykietami', () => {
    expect(EDITOR_TABS.map(t => [t.tab, t.label])).toEqual([
      ['template', 'Szablon'],
      ['content', 'Treść'],
      ['look', 'Wygląd'],
    ])
  })
  it('klucz zapisu', () => {
    expect(EDITOR_TAB_STORAGE_KEY).toBe('sknm-editor-tab')
  })
})

describe('parseEditorTab', () => {
  it('znane wartości przechodzą bez zmian', () => {
    for (const { tab } of EDITOR_TABS) expect(parseEditorTab(tab)).toBe(tab)
  })
  it('brak wpisu i śmieci → szablon', () => {
    for (const raw of [null, undefined, '', 'Content', 'inne', 5, {}, [], true]) expect(parseEditorTab(raw), String(raw)).toBe('template')
  })
  it('serializeEditorTab zwraca wartość zakładki', () => {
    expect(serializeEditorTab('look')).toBe('look')
    expect(parseEditorTab(serializeEditorTab('content'))).toBe('content')
  })
})
