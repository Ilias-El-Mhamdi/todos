import { describe, expect, it } from 'vitest'
import type { Task } from '../data/tasks'
import { applyChanges, formatDates, formatSubtasks, parseDates, parseSubtasks } from './tasks'

const a: Task = { id: 'a', title: 'A', category: 'appartement', frequency: 'weekly' }
const b: Task = { id: 'b', title: 'B', category: 'voiture', frequency: 'monthly' }
const c: Task = { id: 'c', title: 'C', category: 'carriere', frequency: 'annual' }

describe('applyChanges', () => {
  it('applies edits, deletions and additions', () => {
    const edited = { ...a, title: 'A modifiée' }
    expect(applyChanges([a, b], { added: [c], edited: { a: edited }, deleted: ['b'] })).toEqual([edited, c])
  })
})

describe('parseSubtasks / formatSubtasks', () => {
  it('parses groups and lines', () => {
    const subs = parseSubtasks('Cuisine :\nPlacards\n\nSalle de bain:\nJoints\n')!
    expect(subs.map((s) => [s.group, s.title])).toEqual([
      ['Cuisine', 'Placards'],
      ['Salle de bain', 'Joints'],
    ])
  })

  it('uses a default group and returns undefined when empty', () => {
    expect(parseSubtasks('Un\nDeux')!.map((s) => s.group)).toEqual(['Étapes', 'Étapes'])
    expect(parseSubtasks('  \n')).toBeUndefined()
  })

  it('keeps ids of unchanged titles', () => {
    const previous = [{ id: 'keep', group: 'X', title: 'Placards' }]
    const subs = parseSubtasks('Placards\nNouveau', previous)!
    expect(subs[0].id).toBe('keep')
    expect(subs[1].id).not.toBe('keep')
  })

  it('round-trips', () => {
    const text = 'Cuisine :\nPlacards\n\nSalle de bain :\nJoints'
    expect(formatSubtasks(parseSubtasks(text))).toBe(text)
    expect(formatSubtasks(parseSubtasks('Un\nDeux'))).toBe('Un\nDeux')
  })
})

describe('parseDates / formatDates', () => {
  it('parses day/month lists', () => {
    expect(parseDates('15/10, 1/4')).toEqual(['04-01', '10-15'])
    expect(formatDates(['04-01', '10-15'])).toBe('01/04, 15/10')
  })

  it('rejects invalid dates', () => {
    expect(parseDates('31/04')).toBeNull()
    expect(parseDates('29/02')).toBeNull()
    expect(parseDates('avril')).toBeNull()
    expect(parseDates('')).toEqual([])
  })
})

describe('catalog', () => {
  it('has unique task ids and unique subtask ids per task', async () => {
    const { TASKS } = await import('../data/tasks')
    const ids = TASKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TASKS) {
      const subIds = t.subtasks?.map((s) => s.id) ?? []
      expect(new Set(subIds).size).toBe(subIds.length)
    }
  })

  it('gives every fixed task at least one valid date', async () => {
    const { TASKS } = await import('../data/tasks')
    for (const t of TASKS.filter((t) => t.frequency === 'fixed')) {
      expect(t.dates?.length, t.id).toBeGreaterThan(0)
      for (const d of t.dates!) expect(d, t.id).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
    }
  })
})
