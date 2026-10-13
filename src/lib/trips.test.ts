import { describe, expect, it } from 'vitest'
import type { Trip } from './trips'
import {
  addPackItem,
  createTrip,
  duplicateTrip,
  generateItems,
  guessPackCategory,
  itemsFor,
  nights,
  progress,
  sortTrips,
} from './trips'

const find = (trip: Trip, name: string) => trip.items.find((i) => i.name === name)

describe('generateItems', () => {
  it('sizes clothes to the number of nights, capped at a week', () => {
    const short = generateItems([], 2)
    expect(short.find((i) => i.name === 'Sous-vêtements')?.qty).toBe(3)
    expect(short.find((i) => i.name === 'Pantalons')?.qty).toBe(1)
    const long = generateItems([], 14)
    expect(long.find((i) => i.name === 'Chaussettes')?.qty).toBe(7)
    expect(long.find((i) => i.name === 'Pantalons')?.qty).toBe(3)
  })

  it('adds items per tag without duplicates', () => {
    const items = generateItems(['plage', 'montagne', 'voiture'], 3)
    expect(items.filter((i) => i.name === 'Crème solaire')).toHaveLength(1)
    expect(items.filter((i) => i.name === 'Lunettes de soleil')).toHaveLength(1)
    expect(items.some((i) => i.name === 'Permis de conduire')).toBe(true)
    expect(items.some((i) => i.name === 'Passeport (validité ≥ 6 mois)')).toBe(false)
  })
})

describe('trips', () => {
  it('counts nights and defaults to 3', () => {
    expect(nights({ start: '2026-10-20', end: '2026-10-25' })).toBe(5)
    expect(nights({})).toBe(3)
  })

  it('creates a trip with a generated list', () => {
    const trip = createTrip({ name: 'Lyon', start: '2026-10-20', end: '2026-10-22', tags: ['train'] })
    expect(find(trip, 'T-shirts')?.qty).toBe(3)
    expect(find(trip, 'Livre / liseuse')).toBeDefined()
  })

  it('duplicates a list unchecked and without dates', () => {
    let trip = createTrip({ name: 'A', start: '2026-01-01', end: '2026-01-03', tags: [] })
    trip = { ...trip, items: trip.items.map((i) => ({ ...i, out: true, back: true })) }
    const copy = duplicateTrip(trip, 'B')
    expect(copy.name).toBe('B')
    expect(copy.start).toBeUndefined()
    expect(copy.items.every((i) => !i.out && !i.back)).toBe(true)
    expect(copy.items[0].id).not.toBe(trip.items[0].id)
  })
})

describe('quick add', () => {
  it('parses quantity and guesses the category', () => {
    let trip = createTrip({ name: 'T', tags: [] })
    trip = addPackItem(trip, '2 shorts')
    trip = addPackItem(trip, 'adaptateur USB-C')
    trip = addPackItem(trip, 'crème hydratante')
    trip = addPackItem(trip, 'jeu de cartes')
    expect(find(trip, 'Shorts')).toMatchObject({ qty: 2, category: 'vetements' })
    expect(find(trip, 'Adaptateur USB-C')?.category).toBe('electronique')
    expect(find(trip, 'Crème hydratante')?.category).toBe('toilette')
    expect(find(trip, 'Jeu de cartes')?.category).toBe('divers')
  })

  it('ignores duplicates', () => {
    const trip = createTrip({ name: 'T', tags: [] })
    expect(addPackItem(trip, 'chargeur téléphone')).toBe(trip)
  })

  it('guesses categories', () => {
    expect(guessPackCategory('Passeport')).toBe('papiers')
    expect(guessPackCategory('Doliprane')).toBe('sante')
  })
})

describe('phases', () => {
  it('checks the way back on what actually left home', () => {
    let trip = createTrip({ name: 'T', tags: [] })
    expect(itemsFor(trip, 'back')).toHaveLength(trip.items.length)
    trip = { ...trip, items: trip.items.map((i, n) => ({ ...i, out: n < 3, back: n === 0 })) }
    expect(itemsFor(trip, 'back')).toHaveLength(3)
    expect(progress(trip, 'back')).toEqual({ done: 1, total: 3 })
    expect(progress(trip, 'out')).toEqual({ done: 3, total: trip.items.length })
  })
})

describe('sortTrips', () => {
  it('puts upcoming trips first, soonest first, then past ones', () => {
    const t = (name: string, start?: string, end?: string): Trip => ({
      id: name,
      name,
      start,
      end,
      tags: [],
      items: [],
    })
    const sorted = sortTrips(
      [
        t('past-old', '2026-01-01', '2026-01-05'),
        t('later', '2026-12-01', '2026-12-05'),
        t('nodate'),
        t('soon', '2026-10-20', '2026-10-22'),
        t('past-recent', '2026-09-01', '2026-09-05'),
      ],
      '2026-10-13',
    )
    expect(sorted.map((x) => x.name)).toEqual(['soon', 'later', 'nodate', 'past-recent', 'past-old'])
  })
})
