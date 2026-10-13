import { describe, expect, it } from 'vitest'
import type { Attachment } from './attachments'
import { addAttachment, fitSize, formatSize, removeAttachment } from './attachments'

const file = (id: string): Attachment => ({ id, name: `${id}.jpg`, type: 'image/jpeg', size: 1000, createdAt: '' })

describe('attachments', () => {
  it('adds per task and drops the task entry with its last file', () => {
    let map = addAttachment({}, 'task', file('a'))
    map = addAttachment(map, 'task', file('b'))
    expect(map.task.map((a) => a.id)).toEqual(['a', 'b'])
    map = removeAttachment(map, 'task', 'a')
    expect(map.task.map((a) => a.id)).toEqual(['b'])
    expect(removeAttachment(map, 'task', 'b')).toEqual({})
  })

  it('fits the longest side, keeping the ratio, without upscaling', () => {
    expect(fitSize(4032, 3024)).toEqual({ width: 1600, height: 1200 })
    expect(fitSize(3024, 4032)).toEqual({ width: 1200, height: 1600 })
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('formats sizes in French units', () => {
    expect(formatSize(500)).toBe('500 o')
    expect(formatSize(300 * 1024)).toBe('300 Ko')
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2,5 Mo')
  })
})
