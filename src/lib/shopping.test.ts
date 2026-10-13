import { describe, expect, it } from 'vitest'
import type { ShoppingState } from './shopping'
import {
  EMPTY_SHOPPING,
  addItem,
  addMissingToList,
  addStarterStock,
  addStock,
  clearChecked,
  forget,
  guessAisle,
  guessLocation,
  isOnList,
  setAisle,
  stockLevel,
  suggestions,
  updateStock,
} from './shopping'

describe('guessAisle', () => {
  it('guesses from keywords, ignoring case, accents and plurals', () => {
    expect(guessAisle('Bananes')).toBe('fruits-legumes')
    expect(guessAisle('2 L de lait')).toBe('frais')
    expect(guessAisle('Œufs bio')).toBe('frais')
    expect(guessAisle('Pâtes complètes')).toBe('epicerie')
    expect(guessAisle('papier toilette')).toBe('hygiene')
    expect(guessAisle('Bière')).toBe('boissons')
    expect(guessAisle('truc bizarre')).toBe('autre')
  })

  it('prefers the longest keyword', () => {
    expect(guessAisle('vinaigre blanc')).toBe('entretien')
    expect(guessAisle('vinaigre balsamique')).toBe('epicerie')
    expect(guessAisle('pommes de terre')).toBe('fruits-legumes')
    expect(guessAisle('liquide vaisselle')).toBe('entretien')
  })

  it('does not match inside other words', () => {
    expect(guessAisle('cafetière')).toBe('autre')
  })

  it('uses the aisle learned from history first', () => {
    expect(guessAisle('Lait', { lait: { name: 'Lait', aisle: 'epicerie', count: 1 } })).toBe('epicerie')
  })
})

describe('list operations', () => {
  it('adds items and ignores duplicates', () => {
    let s = addItem(EMPTY_SHOPPING, 'Lait')
    s = addItem(s, ' lait ')
    s = addItem(s, '')
    expect(s.items.map((i) => [i.name, i.aisle])).toEqual([['Lait', 'frais']])
  })

  it('unchecks an item already in the basket instead of duplicating it', () => {
    let s = addItem(EMPTY_SHOPPING, 'Lait')
    s = { ...s, items: s.items.map((i) => ({ ...i, checked: true })) }
    s = addItem(s, 'Lait')
    expect(s.items).toHaveLength(1)
    expect(s.items[0].checked).toBe(false)
  })

  it('clears checked items into the history', () => {
    let s = addItem(addItem(EMPTY_SHOPPING, 'Lait'), 'Pain')
    s = { ...s, items: s.items.map((i) => ({ ...i, checked: i.name === 'Lait' })) }
    s = clearChecked(s)
    expect(s.items.map((i) => i.name)).toEqual(['Pain'])
    expect(s.history.lait).toEqual({ name: 'Lait', aisle: 'frais', count: 1 })
  })

  it('learns aisle changes for known items', () => {
    const base: ShoppingState = { items: [], stock: [], history: { lait: { name: 'Lait', aisle: 'frais', count: 3 } } }
    let s = addItem(base, 'Lait')
    s = setAisle(s, s.items[0].id, 'epicerie')
    expect(s.history.lait.aisle).toBe('epicerie')
  })

  it('forgets a history entry', () => {
    const s: ShoppingState = { items: [], stock: [], history: { lait: { name: 'Lait', aisle: 'frais', count: 2 } } }
    expect(forget(s, 'LAIT').history).toEqual({})
  })

  it('suggests frequent items not already on the list', () => {
    const s: ShoppingState = {
      stock: [],
      items: [{ id: '1', name: 'Pain', aisle: 'boulangerie', checked: false }],
      history: {
        pain: { name: 'Pain', aisle: 'boulangerie', count: 9 },
        lait: { name: 'Lait', aisle: 'frais', count: 5 },
        oeufs: { name: 'Oeufs', aisle: 'frais', count: 7 },
      },
    }
    expect(suggestions(s).map((e) => e.name)).toEqual(['Oeufs', 'Lait'])
    expect(suggestions(s, 'LAI').map((e) => e.name)).toEqual(['Lait'])
  })
})

describe('quantities on the list', () => {
  it('stores and sums quantities', () => {
    let s = addItem(EMPTY_SHOPPING, 'Farine', undefined, { qty: 500, unit: 'g' })
    s = addItem(s, 'farine', undefined, { qty: 1, unit: 'kg' })
    expect(s.items).toHaveLength(1)
    expect(s.items[0]).toMatchObject({ qty: 1500, unit: 'g' })
  })

  it('matches plurals as the same item', () => {
    const s = addItem(addItem(EMPTY_SHOPPING, 'Œuf', undefined, { qty: 6, unit: '' }), 'oeufs', undefined, { qty: 6, unit: '' })
    expect(s.items).toHaveLength(1)
    expect(s.items[0].qty).toBe(12)
  })

  it('adds the bought quantity to counted stock', () => {
    let s = addStock(EMPTY_SHOPPING, 'Oeufs')
    s = updateStock(s, s.stock[0].id, { qty: 2, min: 2 })
    s = addItem(s, 'Œufs', undefined, { qty: 6, unit: '' })
    s = clearChecked({ ...s, items: s.items.map((i) => ({ ...i, checked: true })) })
    expect(s.stock[0].qty).toBe(8)
  })
})

describe('stock', () => {
  it('guesses where things are stored', () => {
    expect(guessLocation('Yaourts')).toBe('frigo')
    expect(guessLocation('Lessive')).toBe('menage')
    expect(guessLocation('Glace vanille')).toBe('congelateur')
  })

  it('adds stock items without duplicates', () => {
    let s = addStock(EMPTY_SHOPPING, 'Riz')
    s = addStock(s, 'riz')
    expect(s.stock.map((st) => [st.name, st.location, st.level])).toEqual([['Riz', 'placards', 'ok']])
  })

  it('puts low and empty items on the list once', () => {
    let s = addStock(addStock(addStock(EMPTY_SHOPPING, 'Riz'), 'Lait'), 'Sel')
    s = updateStock(s, s.stock[0].id, { level: 'bas' })
    s = updateStock(s, s.stock[1].id, { level: 'vide' })
    s = addMissingToList(addMissingToList(s))
    expect(s.items.map((i) => i.name)).toEqual(['Riz', 'Lait'])
    expect(isOnList(s, 'lait')).toBe(true)
    expect(isOnList(s, 'Sel')).toBe(false)
  })

  it('marks bought items back in stock when shopping is done', () => {
    let s = updateStock(addStock(EMPTY_SHOPPING, 'Lait'), '', {})
    s = updateStock(s, s.stock[0].id, { level: 'vide' })
    s = addMissingToList(s)
    s = { ...s, items: s.items.map((i) => ({ ...i, checked: true })) }
    s = clearChecked(s)
    expect(s.stock[0].level).toBe('ok')
    expect(s.items).toEqual([])
  })

  it('derives the level from the count when there is one', () => {
    const base = { id: '1', name: 'Rouleaux PQ', location: 'salle-de-bain' as const, level: 'ok' as const }
    expect(stockLevel({ ...base, qty: 0 })).toBe('vide')
    expect(stockLevel({ ...base, qty: 1 })).toBe('bas')
    expect(stockLevel({ ...base, qty: 2 })).toBe('ok')
    expect(stockLevel({ ...base, qty: 4, min: 4 })).toBe('bas')
    expect(stockLevel({ ...base, level: 'vide' })).toBe('vide')
  })

  it('restocks counted items above their threshold', () => {
    let s = addStock(EMPTY_SHOPPING, 'Rouleaux PQ')
    s = updateStock(s, s.stock[0].id, { qty: 1, min: 3 })
    s = addMissingToList(s)
    s = clearChecked({ ...s, items: s.items.map((i) => ({ ...i, checked: true })) })
    expect(s.stock[0].qty).toBe(4)
    expect(stockLevel(s.stock[0])).toBe('ok')
  })

  it('adds the starter pack without duplicating existing items', () => {
    const s = addStarterStock(addStock(EMPTY_SHOPPING, 'lait'))
    expect(s.stock.filter((st) => st.name.toLowerCase() === 'lait')).toHaveLength(1)
    expect(s.stock.length).toBeGreaterThan(20)
  })
})
