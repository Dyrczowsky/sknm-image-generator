import type { Database } from 'sql.js'
import type { DraftRow } from '../types'
import { rowsFromExec } from './utils'

// Draft sprzed kopii roboczej (`src/workspace/`). Nic go już nie zapisuje;
// odczyt służy jednorazowej migracji przy pierwszym starcie nowej wersji,
// żeby dotychczasowa praca nie zniknęła.
export function getDraft(db: Database): DraftRow | null {
  const result = db.exec('SELECT * FROM draft WHERE id = 1')
  const rows = rowsFromExec<DraftRow>(result)
  return rows[0] ?? null
}
