import { apiBlob, apiFetch } from './api'

/** What the state keeps about a file stored on the server (the content itself stays out of the synced state). */
export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

/** Attachments by task id. */
export type AttachmentsByTask = Record<string, Attachment[]>

/** Server limit (back: MAX_ATTACHMENT_BYTES). */
export const MAX_BYTES = 10 * 1024 * 1024
export const ACCEPT = 'image/*,application/pdf'

const MAX_SIDE = 1600
const JPEG_QUALITY = 0.82

export const isImage = (a: Pick<Attachment, 'type'>) => a.type.startsWith('image/')

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`
}

export function addAttachment(map: AttachmentsByTask, taskId: string, attachment: Attachment): AttachmentsByTask {
  return { ...map, [taskId]: [...(map[taskId] ?? []), attachment] }
}

export function removeAttachment(map: AttachmentsByTask, taskId: string, id: string): AttachmentsByTask {
  const rest = (map[taskId] ?? []).filter((a) => a.id !== id)
  const next = { ...map }
  if (rest.length) next[taskId] = rest
  else delete next[taskId]
  return next
}

/** Size that fits the longest side in `maxSide` px, keeping the ratio; smaller images are left as is. */
export function fitSize(width: number, height: number, maxSide = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Phone photos are several MB: downscale and re-encode as JPEG before upload. Anything that isn't a still image, or
 * that the browser can't decode (e.g. HEIC outside Safari), is sent as is; so is a result that wouldn't be smaller.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const { width, height } = fitSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function uploadAttachment(file: File): Promise<Attachment> {
  const body = new FormData()
  body.append('file', file)
  return apiFetch<Attachment>('/attachments', { method: 'POST', body })
}

export function deleteAttachment(id: string): Promise<void> {
  return apiFetch<void>(`/attachments/${id}`, { method: 'DELETE' })
}

const CACHE = 'entretien-attachments'
const urls = new Map<string, Promise<string>>()

/**
 * Object URL of an attachment's content. A file never changes, so it's kept in the Cache API (seen offline, fetched
 * once) and in memory for the session.
 */
export function attachmentUrl(id: string): Promise<string> {
  let url = urls.get(id)
  if (!url) {
    url = loadBlob(id).then((blob) => URL.createObjectURL(blob))
    // Failed (offline, deleted): let a later call try again.
    url.catch(() => urls.delete(id))
    urls.set(id, url)
  }
  return url
}

async function loadBlob(id: string): Promise<Blob> {
  const key = `/attachments/${id}`
  const cache = await caches.open(CACHE).catch(() => null)
  const hit = await cache?.match(key)
  if (hit) return hit.blob()
  const blob = await apiBlob(key)
  await cache?.put(key, new Response(blob, { headers: { 'content-type': blob.type } })).catch(() => {})
  return blob
}

/** Drops a deleted attachment from the local caches. */
export async function forgetAttachment(id: string) {
  const url = urls.get(id)
  urls.delete(id)
  url?.then(URL.revokeObjectURL, () => {})
  await caches
    .open(CACHE)
    .then((c) => c.delete(`/attachments/${id}`))
    .catch(() => {})
}
