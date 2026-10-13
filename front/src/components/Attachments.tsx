import { useEffect, useRef, useState } from 'react'
import type { Attachment } from '../lib/attachments'
import { ACCEPT, MAX_BYTES, attachmentUrl, compressImage, formatSize, isImage, uploadAttachment } from '../lib/attachments'
import { ApiError } from '../lib/api'

/** Loads an attachment's content; null while loading, 'error' if it can't be fetched (offline, deleted). */
function useAttachmentUrl(id: string | null) {
  const [loaded, setLoaded] = useState<{ id: string; url: string | 'error' } | null>(null)

  useEffect(() => {
    if (!id) return
    let live = true
    attachmentUrl(id).then(
      (url) => live && setLoaded({ id, url }),
      () => live && setLoaded({ id, url: 'error' }),
    )
    return () => {
      live = false
    }
  }, [id])

  return loaded && loaded.id === id ? loaded.url : null
}

/** "📎 Joindre" link: picks files, compresses photos and uploads them one by one. */
export function AttachButton({ onAdded }: { onAdded: (attachment: Attachment) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)

  const upload = async (files: File[]) => {
    setUploading(files.length)
    const failed: string[] = []
    for (const original of files) {
      try {
        const file = await compressImage(original)
        if (file.size > MAX_BYTES) throw new Error(`trop lourd (${formatSize(file.size)}, max ${formatSize(MAX_BYTES)})`)
        onAdded(await uploadAttachment(file))
      } catch (err) {
        const reason =
          err instanceof TypeError ? 'serveur injoignable' : err instanceof ApiError || err instanceof Error ? err.message : 'échec'
        failed.push(`${original.name} : ${reason}`)
      }
      setUploading((n) => n - 1)
    }
    if (failed.length) window.alert(`Pièce(s) jointe(s) non ajoutée(s)\n\n${failed.join('\n')}`)
  }

  return (
    <>
      <button className="link" onClick={() => input.current?.click()} disabled={uploading > 0}>
        {uploading > 0 ? `Envoi… (${uploading})` : '📎 Joindre'}
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = '' // allow picking the same file again
          if (files.length) void upload(files)
        }}
      />
    </>
  )
}

function Thumb({ attachment, onOpen }: { attachment: Attachment; onOpen: () => void }) {
  const url = useAttachmentUrl(isImage(attachment) ? attachment.id : null)
  return (
    <button className="attachment-thumb" onClick={onOpen} title={attachment.name} aria-label={`Ouvrir ${attachment.name}`}>
      {isImage(attachment) && url && url !== 'error' ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <span className="attachment-icon" aria-hidden>
          {isImage(attachment) ? (url === 'error' ? '⚠️' : '…') : '📄'}
        </span>
      )}
    </button>
  )
}

/** Thumbnails of a task's attachments; tapping one opens it full screen. */
export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[]
  onRemove: (attachment: Attachment) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = attachments.find((a) => a.id === openId) ?? null

  return (
    <>
      <div className="attachment-list">
        {attachments.map((a) => (
          <Thumb key={a.id} attachment={a} onOpen={() => setOpenId(a.id)} />
        ))}
      </div>
      {open && (
        <AttachmentViewer
          attachment={open}
          onClose={() => setOpenId(null)}
          onRemove={() => {
            setOpenId(null)
            onRemove(open)
          }}
        />
      )}
    </>
  )
}

function AttachmentViewer({
  attachment,
  onClose,
  onRemove,
}: {
  attachment: Attachment
  onClose: () => void
  onRemove: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const url = useAttachmentUrl(attachment.id)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="attachment-viewer"
      onClose={onClose}
      // Tap on the backdrop closes it.
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
    >
      <div className="attachment-content">
        {url === null ? (
          <p className="hint">Chargement…</p>
        ) : url === 'error' ? (
          <p className="hint">Impossible de charger le fichier (hors ligne ?)</p>
        ) : isImage(attachment) ? (
          <img src={url} alt={attachment.name} />
        ) : (
          <iframe src={url} title={attachment.name} />
        )}
      </div>
      <div className="attachment-bar">
        <span className="attachment-name">
          {attachment.name} · {formatSize(attachment.size)}
        </span>
        {url && url !== 'error' && (
          <a className="link-button" href={url} download={attachment.name}>
            Télécharger
          </a>
        )}
        <button
          className="danger"
          onClick={() => window.confirm(`Supprimer « ${attachment.name} » ?`) && onRemove()}
        >
          Supprimer
        </button>
        <button className="primary" onClick={() => dialog.current?.close()}>
          Fermer
        </button>
      </div>
    </dialog>
  )
}
