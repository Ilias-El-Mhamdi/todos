import { useRef, useState } from 'react'
import { BackupError, backupFileName, parseBackup, serializeBackup } from '../lib/backup'

interface Props {
  state: unknown
  /** Replaces the whole state; gets synced to the server like any edit. */
  onRestore: (data: Record<string, unknown>) => void
}

/** Download the whole state as a JSON file, or replace it with a previously downloaded one. */
export function BackupControls({ state, onRestore }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

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
    try {
      const { data, exportedAt } = parseBackup(await file.text())
      const date = exportedAt ? new Date(exportedAt).toLocaleString('fr-FR') : 'date inconnue'
      if (!window.confirm(`Remplacer toutes les données actuelles par la sauvegarde du ${date} ?`)) return
      onRestore(data)
      setMessage({ text: 'Sauvegarde restaurée' })
    } catch (err) {
      setMessage({ text: err instanceof BackupError ? err.message : 'Impossible de lire le fichier', error: true })
    }
  }

  return (
    <div className="backup-controls">
      <button className="link" onClick={exportBackup}>
        Exporter les données
      </button>
      <span aria-hidden>·</span>
      <button className="link" onClick={() => input.current?.click()}>
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
