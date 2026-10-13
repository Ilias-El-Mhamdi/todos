import { describe, expect, it } from 'vitest'
import { BackupError, backupFileName, parseBackup, serializeBackup } from './backup'

const now = new Date(2026, 9, 13, 9, 5)

describe('backup', () => {
  it('round-trips the state', () => {
    const data = { done: { a: { last: '2026-10-01', history: ['2026-10-01'] } }, trips: [] }
    const parsed = parseBackup(serializeBackup(data, now))
    expect(parsed.data).toEqual(data)
    expect(parsed.exportedAt).toBe(now.toISOString())
  })

  it('names the file with the local date and time', () => {
    expect(backupFileName(now)).toBe('entretien-backup_2026-10-13_0905.json')
  })

  it.each([
    ['not JSON', 'nope'],
    ['another JSON file', JSON.stringify({ hello: 1 })],
    ['a newer format', JSON.stringify({ format: 'entretien.backup', version: 99, data: { done: {} } })],
    ['missing data', JSON.stringify({ format: 'entretien.backup', version: 1, data: [] })],
    ['data without done', JSON.stringify({ format: 'entretien.backup', version: 1, data: { trips: [] } })],
  ])('rejects %s', (_, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
  })
})
