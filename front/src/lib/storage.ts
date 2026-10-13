import { useEffect, useState } from 'react'

/** Objects get new default fields merged in; other values are used as saved. */
export function mergeDefaults<T>(initial: T, saved: unknown): T {
  const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)
  return (isObject(initial) && isObject(saved) ? { ...initial, ...(saved as object) } : saved) as T
}

export function readLocal<T>(key: string, initial: T, migrate: (saved: unknown) => unknown = (v) => v): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? mergeDefaults(initial, migrate(JSON.parse(raw))) : initial
  } catch {
    return initial
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode, quota): keep in-memory state
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readLocal(key, initial))

  useEffect(() => writeLocal(key, value), [key, value])

  return [value, setValue] as const
}
