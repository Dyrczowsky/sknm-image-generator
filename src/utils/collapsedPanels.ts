export type PanelKey = 'template' | 'form' | 'history' | 'notes'
export type CollapsedPanels = Record<PanelKey, boolean>

export const COLLAPSED_STORAGE_KEY = 'sknm-collapsed-panels'
export const ALL_OPEN: CollapsedPanels = { template: false, form: false, history: false, notes: false }

// Odczyt stanu zwinięcia paneli z localStorage. Cokolwiek nieoczekiwanego
// (brak wpisu, zepsuty JSON, zły typ) → panel rozwinięty.
export function parseCollapsed(raw: string | null): CollapsedPanels {
  if (!raw) return { ...ALL_OPEN }
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ...ALL_OPEN }
    const record = value as Record<string, unknown>
    return {
      template: record.template === true,
      form: record.form === true,
      history: record.history === true,
      notes: record.notes === true,
    }
  } catch {
    return { ...ALL_OPEN }
  }
}
