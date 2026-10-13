import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, apiFetch } from './api'
import { mergeDefaults, readLocal, writeLocal } from './storage'

const SAVE_DELAY_MS = 800
/** Retry period while something is not synced (the `online` event is unreliable in iOS PWAs). */
const RETRY_MS = 30_000

interface Snapshot<T> {
  value: T | null
  updatedAt: string | null
}

/**
 * State kept in the database (`/state/:key`), with localStorage as an offline cache.
 *
 * Sync rule: `base` is the server version (`updatedAt`) the local value derives from, persisted with the cache.
 * - Server still at `base`: local edits ("dirty", persisted across reloads, e.g. made offline) get pushed.
 * - Server moved on (another device saved): the server wins and local unsaved edits are dropped. Saves are
 *   conditional on `base` too (409 otherwise), so a stale device can never overwrite newer data.
 * - Nothing on the server yet: the local value is uploaded (migration from the localStorage-only version).
 *
 * Works offline: edits stay in the cache (and dirty) and are sent once the server is reachable again.
 *
 * `migrate` upgrades a saved value (local or remote) before default fields are merged in.
 */
export function useSyncedState<T>(key: string, initial: T, migrate?: (saved: unknown) => unknown) {
  const dirtyKey = `${key}.dirty`
  const baseKey = `${key}.base`
  const [value, setValue] = useState<T>(() => readLocal(key, initial, migrate))
  // The last request could not reach the server.
  const [offline, setOffline] = useState(false)
  const latest = useRef(value)
  // Value known to match the server: changing to it must not trigger a save.
  const clean = useRef<T | undefined>(value)
  const dirty = useRef(readLocal(dirtyKey, false))
  const base = useRef(readLocal<string | null>(baseKey, null))
  // A server answer was received at least once: saves wait for it, so they start from a known base.
  const synced = useRef(false)
  const initialRef = useRef(initial)
  const migrateRef = useRef(migrate)

  const markDirty = useCallback(
    (on: boolean) => {
      dirty.current = on
      writeLocal(dirtyKey, on || undefined)
    },
    [dirtyKey],
  )

  const setBase = useCallback(
    (updatedAt: string | null) => {
      base.current = updatedAt
      writeLocal(baseKey, updatedAt ?? undefined)
    },
    [baseKey],
  )

  const applyRemote = useCallback(
    (snapshot: Snapshot<unknown>) => {
      synced.current = true
      setBase(snapshot.updatedAt)
      markDirty(false)
      if (snapshot.value === null) return
      const saved = migrateRef.current ? migrateRef.current(snapshot.value) : snapshot.value
      const next = mergeDefaults(initialRef.current, saved)
      clean.current = next
      setValue(next)
    },
    [markDirty, setBase],
  )

  const push = useCallback(
    async (keepalive = false) => {
      if (!dirty.current) return
      const sent = latest.current
      try {
        const res = await apiFetch<{ updatedAt: string }>(`/state/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: sent, baseUpdatedAt: base.current }),
          keepalive,
        })
        synced.current = true
        setOffline(false)
        setBase(res.updatedAt)
        // Edited again while the request was in flight: stay dirty, the next save sends it.
        if (latest.current === sent) markDirty(false)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) applyRemote(err.body as Snapshot<unknown>)
        // offline or server down: stays dirty, retried on the next change, focus, reconnection or timer
        else if (err instanceof TypeError) setOffline(true) // fetch network failure
      }
    },
    [key, markDirty, setBase, applyRemote],
  )

  const pull = useCallback(async () => {
    try {
      const remote = await apiFetch<Snapshot<unknown>>(`/state/${key}`)
      setOffline(false)
      if (remote.updatedAt !== null && remote.updatedAt === base.current) {
        // Server unchanged since our last sync: our pending edits (if any) are newer.
        synced.current = true
        return push()
      }
      if (remote.value === null) {
        // First sync of this account: upload what this device has.
        synced.current = true
        setBase(null)
        markDirty(true)
        return push()
      }
      applyRemote(remote)
    } catch (err) {
      // offline: keep the cached value
      if (err instanceof TypeError) setOffline(true)
    }
  }, [key, markDirty, setBase, applyRemote, push])

  /**
   * Overwrites the server with `next` whatever it holds (backup restore): on a conflict, retries on top of the version
   * the server returns. Resolves once the server accepted it; rejects otherwise (e.g. offline), leaving state as is.
   */
  const replace = useCallback(
    async (next: T) => {
      let baseUpdatedAt = base.current
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await apiFetch<{ updatedAt: string }>(`/state/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value: next, baseUpdatedAt }),
          })
          synced.current = true
          setOffline(false)
          setBase(res.updatedAt)
          markDirty(false)
          clean.current = next
          setValue(next)
          return
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            baseUpdatedAt = (err.body as Snapshot<unknown>).updatedAt
            continue
          }
          if (err instanceof TypeError) setOffline(true)
          throw err
        }
      }
      throw new Error('Le serveur a changé pendant la restauration, réessaie')
    },
    [key, markDirty, setBase],
  )

  useEffect(() => {
    latest.current = value
    writeLocal(key, value)
    if (value === clean.current) return
    clean.current = undefined
    markDirty(true)
    if (!synced.current) return
    const timer = setTimeout(push, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [key, value, markDirty, push])

  // Fetch on mount, when the app comes back to the foreground (other device may have changed it) and on reconnection;
  // flush pending edits when it goes to the background.
  useEffect(() => {
    // Async: state is only set once the server answers.
    // oxlint-disable-next-line react/set-state-in-effect
    void pull()
    const onVisibility = () => void (document.visibilityState === 'visible' ? pull() : push(true))
    const onOnline = () => void pull()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    const retry = setInterval(() => {
      if (dirty.current || !synced.current) void pull()
    }, RETRY_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      clearInterval(retry)
    }
  }, [pull, push])

  return [value, setValue, offline, replace] as const
}
