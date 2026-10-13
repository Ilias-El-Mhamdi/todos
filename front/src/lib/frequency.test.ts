import { describe, expect, it } from 'vitest'
import { getStatus, nextDue, nextDueKm } from './frequency'

const today = '2026-10-11'

describe('nextDue', () => {
  it('adds days for daily, weekly and biweekly', () => {
    expect(nextDue({ frequency: 'daily' }, '2026-12-31', today)).toBe('2027-01-01')
    expect(nextDue({ frequency: 'weekly' }, '2026-10-11', today)).toBe('2026-10-18')
    expect(nextDue({ frequency: 'biweekly' }, '2026-10-11', today)).toBe('2026-10-25')
  })

  it('clamps month ends', () => {
    expect(nextDue({ frequency: 'monthly' }, '2026-01-31', today)).toBe('2026-02-28')
    expect(nextDue({ frequency: 'quarterly' }, '2026-11-30', today)).toBe('2027-02-28')
    expect(nextDue({ frequency: 'biennial' }, '2024-02-29', today)).toBe('2026-02-28')
  })

  it('handles long intervals', () => {
    expect(nextDue({ frequency: '3y' }, '2026-10-11', today)).toBe('2029-10-11')
    expect(nextDue({ frequency: '5y' }, '2026-10-11', today)).toBe('2031-10-11')
    expect(nextDue({ frequency: '10y' }, '2026-10-11', today)).toBe('2036-10-11')
  })

  it('returns null for one-time tasks, checklists and never-done tasks', () => {
    expect(nextDue({ frequency: 'once' }, '2026-10-11', today)).toBeNull()
    expect(nextDue({ frequency: 'trigger' }, '2026-10-11', today)).toBeNull()
    expect(nextDue({ frequency: 'weekly' }, undefined, today)).toBeNull()
  })
})

describe('nextDue for fixed dates', () => {
  const spring = { frequency: 'fixed' as const, dates: ['04-15'] }
  const twice = { frequency: 'fixed' as const, dates: ['04-15', '10-15'] }

  it('picks the next anchor after the last completion', () => {
    expect(nextDue(spring, '2026-04-20', today)).toBe('2027-04-15')
    expect(nextDue(twice, '2026-04-20', today)).toBe('2026-10-15')
    expect(nextDue(twice, '2026-10-20', today)).toBe('2027-04-15')
  })

  it('counts a completion up to 30 days early', () => {
    expect(nextDue(spring, '2026-03-20', today)).toBe('2027-04-15')
    expect(nextDue(spring, '2026-03-10', today)).toBe('2026-04-15')
  })

  it('keeps a recently passed anchor pending when never done', () => {
    expect(nextDue({ frequency: 'fixed', dates: ['10-01'] }, undefined, today)).toBe('2026-10-01')
    expect(nextDue({ frequency: 'fixed', dates: ['08-01'] }, undefined, today)).toBe('2027-08-01')
  })
})

describe('getStatus', () => {
  it('is "jamais" when never done', () => {
    expect(getStatus({ frequency: 'weekly' }, undefined, today)).toBe('jamais')
    expect(getStatus({ frequency: 'once' }, undefined, today)).toBe('jamais')
  })

  it('is "fait" for a completed one-time task and "checklist" for triggers', () => {
    expect(getStatus({ frequency: 'once' }, { last: '2020-01-01' }, today)).toBe('fait')
    expect(getStatus({ frequency: 'trigger' }, undefined, today)).toBe('checklist')
  })

  it('handles daily tasks', () => {
    expect(getStatus({ frequency: 'daily' }, { last: today }, today)).toBe('ok')
    expect(getStatus({ frequency: 'daily' }, { last: '2026-10-10' }, today)).toBe('aujourdhui')
    expect(getStatus({ frequency: 'daily' }, { last: '2026-10-09' }, today)).toBe('en-retard')
  })

  it('flags tasks close to their due date', () => {
    expect(getStatus({ frequency: 'weekly' }, { last: '2026-10-09' }, today)).toBe('ok')
    expect(getStatus({ frequency: 'weekly' }, { last: '2026-10-05' }, today)).toBe('bientot')
    expect(getStatus({ frequency: 'weekly' }, { last: '2026-10-05' }, '2026-10-12')).toBe('aujourdhui')
    expect(getStatus({ frequency: 'annual' }, { last: '2025-11-01' }, today)).toBe('bientot')
    expect(getStatus({ frequency: 'biennial' }, { last: '2023-10-01' }, today)).toBe('en-retard')
  })

  it('handles fixed dates', () => {
    expect(getStatus({ frequency: 'fixed', dates: ['10-01'] }, undefined, today)).toBe('en-retard')
    expect(getStatus({ frequency: 'fixed', dates: ['10-25'] }, undefined, today)).toBe('bientot')
    expect(getStatus({ frequency: 'fixed', dates: ['04-15'] }, undefined, today)).toBe('ok')
  })

  it('uses whichever comes first between date and mileage', () => {
    const service = { frequency: 'annual' as const, km: 15_000 }
    const record = { last: '2026-06-01', km: 100_000 }
    expect(getStatus(service, record, today)).toBe('ok')
    expect(getStatus(service, record, today, 110_000)).toBe('ok')
    expect(getStatus(service, record, today, 114_000)).toBe('bientot')
    expect(getStatus(service, record, today, 116_000)).toBe('en-retard')
    expect(nextDueKm(service, record)).toBe(115_000)
    expect(nextDueKm(service, { last: '2026-06-01' })).toBeNull()
  })
})
