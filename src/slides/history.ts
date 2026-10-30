// Ogólna, czysta historia cofnij/ponów. Bez efektów ubocznych: każda funkcja
// zwraca nowy obiekt, a stary zostaje nietknięty.

export interface History<T> {
  past: T[]
  present: T
  future: T[]
  // Klucz ostatniego wpisu do `past` i jego czas. Pozwalają sklejać kolejne
  // zmiany tego samego pola (pisanie) w jedno cofnięcie.
  lastKey: string | null
  lastAt: number
}

export const HISTORY_LIMIT = 100
export const COALESCE_MS = 1000

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [], lastKey: null, lastAt: 0 }
}

// Nowy stan. Ten sam obiekt => bez zmian, żeby nie tworzyć pustych wpisów.
// Sklejanie porównuje z czasem wpisu w `past`, a nie ostatniego naciśnięcia,
// więc długie pisanie tworzy co sekundę nowy wpis zamiast jednego wielkiego.
export function pushHistory<T>(
  h: History<T>,
  next: T,
  options?: { key?: string; now?: number },
): History<T> {
  if (next === h.present) return h

  const key = options?.key ?? null
  const now = options?.now ?? Date.now()

  if (key !== null && key === h.lastKey && now - h.lastAt < COALESCE_MS) {
    // Okno przesuwa się z każdą literą: ciągłe pisanie = jedno cofnięcie.
    return { ...h, present: next, future: [], lastAt: now }
  }

  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    lastKey: key,
    lastAt: now,
  }
}

export function undo<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h
  const previous = h.past[h.past.length - 1]
  return {
    past: h.past.slice(0, -1),
    present: previous,
    future: [h.present, ...h.future],
    // Po cofnięciu następny zapis nie może skleić się z wcześniejszym pisaniem.
    lastKey: null,
    lastAt: h.lastAt,
  }
}

export function redo<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h
  const [next, ...rest] = h.future
  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: next,
    future: rest,
    lastKey: null,
    lastAt: h.lastAt,
  }
}

export function canUndo<T>(h: History<T>): boolean {
  return h.past.length > 0
}

export function canRedo<T>(h: History<T>): boolean {
  return h.future.length > 0
}

// Zmiana bez śladu w historii (np. zapisany updatedAt). Nie rusza past/future
// ani klucza sklejania, więc pisanie nadal skleja się z wcześniejszym wpisem.
export function replacePresent<T>(h: History<T>, present: T): History<T> {
  return { ...h, present }
}
