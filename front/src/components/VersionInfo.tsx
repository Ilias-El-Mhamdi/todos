import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

interface Version {
  commit: string
  date: string
}

const short = (commit: string) => commit.slice(0, 7)
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const FRONT: Version = { commit: __APP_VERSION__.commit, date: __APP_VERSION__.builtAt }

/**
 * Front and back commits, to check a deploy went through (compare with the latest commit on GitHub).
 * They can legitimately differ: each side only redeploys when its own folder changes.
 */
export function VersionInfo() {
  const [back, setBack] = useState<Version | 'offline' | null>(null)

  useEffect(() => {
    apiFetch<{ commit: string; startedAt: string }>('/version')
      .then((v) => setBack({ commit: v.commit, date: v.startedAt }))
      .catch(() => setBack('offline'))
  }, [])

  return (
    <p className="version-info">
      <span title={FRONT.commit}>
        front {short(FRONT.commit)} · build {formatDate(FRONT.date)}
      </span>
      <span title={back && back !== 'offline' ? back.commit : undefined}>
        back{' '}
        {back === null
          ? '…'
          : back === 'offline'
            ? 'injoignable'
            : `${short(back.commit)} · démarré ${formatDate(back.date)}`}
      </span>
    </p>
  )
}
