const FORMAT = 'entretien.backup'
const VERSION = 1

interface BackupFile {
  format: typeof FORMAT
  version: number
  exportedAt: string
  data: unknown
}

export class BackupError extends Error {}

export function serializeBackup(data: unknown, now: Date): string {
  const file: BackupFile = { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), data }
  return JSON.stringify(file, null, 2)
}

export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
  return `entretien-backup_${stamp}.json`
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Reads a backup file and returns its data, ready to go through the state migration. Throws BackupError otherwise. */
export function parseBackup(text: string): { data: Record<string, unknown>; exportedAt: string } {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    throw new BackupError('Fichier illisible (JSON invalide)')
  }
  if (!isObject(file) || file.format !== FORMAT) throw new BackupError('Ce fichier n’est pas une sauvegarde de l’app')
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new BackupError('Sauvegarde faite par une version plus récente de l’app')
  }
  if (!isObject(file.data) || !isObject(file.data.done)) throw new BackupError('Sauvegarde incomplète ou corrompue')
  return { data: file.data, exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '' }
}
