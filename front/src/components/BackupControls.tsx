import { useRef, useState } from 'react'
import { BackupError, backupFileName, parseBackup, serializeBackup } from '../lib/backup'

interface Props {
  state: unknown
  /** Replaces the whole state on the server; resolves once it accepted it. */
  onRestore: (data: Record<string, unknown>) => Promise<void>
}

/** Download the whole state as a JSON file, or replace it with a previously downloaded one. */
export function BackupControls({ state, onRestore }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [restoring, setRestoring] = useState(false)

  const exportBackup = () => {
    const now = new Date()
    const blob = new Blob([serializeBackup(state, now)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName(now)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage({ text: 'Sauvegarde téléchargée' })
  }

  const importBackup = async (file: File) => {
    let data: Record<string, unknown>
    try {
      const backup = parseBackup(await file.text())
      const date = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('fr-FR') : 'date inconnue'
      if (!window.confirm(`Remplacer toutes les données actuelles par la sauvegarde du ${date} ?`)) return
      data = backup.data
    } catch (err) {
      setMessage({ text: err instanceof BackupError ? err.message : 'Impossible de lire le fichier', error: true })
      return
    }
    setRestoring(true)
    setMessage({ text: 'Restauration…' })
    try {
      await onRestore(data)
      setMessage({ text: 'Sauvegarde restaurée' })
    } catch (err) {
      const text = err instanceof TypeError ? 'Serveur injoignable : la restauration demande une connexion' : err instanceof Error ? err.message : 'Échec'
      setMessage({ text: `Restauration non faite · ${text}`, error: true })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="backup-controls">
      <button className="link" onClick={exportBackup}>
        Exporter les données
      </button>
      <span aria-hidden>·</span>
      <button className="link" onClick={() => input.current?.click()} disabled={restoring}>
        Restaurer une sauvegarde
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // allow picking the same file again
          if (file) void importBackup(file)
        }}
      />
      {message && (
        <p className={message.error ? 'backup-message error' : 'backup-message'} role="status">
          {message.text}
        </p>
      )}
    </div>
  )
}
