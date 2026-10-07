import { useEffect, useState } from 'react'

interface StoredStateOptions<T> {
  // Zamienia zapisany tekst (`null` = brak wpisu) na wartość; musi znosić śmieci.
  parse: (raw: string | null) => T
  serialize: (value: T) => string
}

// `useState` pamiętany w localStorage pod kluczem `key`. Gdy localStorage
// jest niedostępny (np. tryb prywatny), wartość żyje tylko w pamięci sesji.
export function useStoredState<T>(key: string, { parse, serialize }: StoredStateOptions<T>) {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key))
    } catch {
      return parse(null)
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value))
    } catch {
      // Brak localStorage - nic do zapisania.
    }
  }, [key, serialize, value])

  return [value, setValue] as const
}
