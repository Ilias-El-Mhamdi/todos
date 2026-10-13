import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const saved = JSON.parse(raw)
      // Objects get new default fields merged in; other values are used as saved.
      const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)
      return isObject(initial) && isObject(saved) ? { ...initial, ...saved } : saved
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (private mode, quota): keep in-memory state
    }
  }, [key, value])

  return [value, setValue] as const
}
