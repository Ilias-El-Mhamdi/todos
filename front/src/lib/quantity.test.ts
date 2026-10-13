import { describe, expect, it } from 'vitest'
import { addQty, formatQty, missingQty, parseEntry } from './quantity'

describe('parseEntry', () => {
  it('reads a leading quantity', () => {
    expect(parseEntry('2 lait')).toEqual({ name: 'lait', qty: 2, unit: '' })
    expect(parseEntry('500 g de farine')).toEqual({ name: 'farine', qty: 500, unit: 'g' })
    expect(parseEntry('1,5 L lait')).toEqual({ name: 'lait', qty: 1.5, unit: 'L' })
    expect(parseEntry("200g d'emmental")).toEqual({ name: 'emmental', qty: 200, unit: 'g' })
    expect(parseEntry('x3 citrons')).toEqual({ name: 'citrons', qty: 3, unit: '' })
  })

  it('reads a trailing quantity', () => {
    expect(parseEntry('lait x2')).toEqual({ name: 'lait', qty: 2, unit: '' })
    expect(parseEntry('farine 1kg')).toEqual({ name: 'farine', qty: 1, unit: 'kg' })
  })

  it('keeps kitchen measures apart from the ingredient', () => {
    expect(parseEntry('1 pincée de sel')).toEqual({ name: 'sel', measure: '1 pincée' })
    expect(parseEntry("2 gousses d'ail")).toEqual({ name: 'ail', measure: '2 gousses' })
    expect(parseEntry("1 c. à soupe d'huile")).toEqual({ name: 'huile', measure: '1 c. à soupe' })
    expect(parseEntry('filet de citron')).toEqual({ name: 'citron', measure: 'filet' })
  })

  it('leaves plain names alone', () => {
    expect(parseEntry('Piles AA')).toEqual({ name: 'Piles AA' })
    expect(parseEntry('  sel  ')).toEqual({ name: 'sel' })
    expect(parseEntry('0 lait')).toEqual({ name: 'lait' })
  })
})

describe('formatQty', () => {
  it('formats counts and units', () => {
    expect(formatQty({ qty: 2, unit: '' })).toBe('×2')
    expect(formatQty({ qty: 1.5, unit: 'L' })).toBe('1,5 L')
    expect(formatQty({})).toBe('')
  })
})

describe('addQty / missingQty', () => {
  it('adds compatible quantities in the first unit', () => {
    expect(addQty({ qty: 1, unit: 'kg' }, { qty: 500, unit: 'g' })).toEqual({ qty: 1.5, unit: 'kg' })
    expect(addQty({ qty: 2, unit: '' }, { qty: 3, unit: '' })).toEqual({ qty: 5, unit: '' })
    expect(addQty({}, { qty: 3, unit: 'g' })).toEqual({ qty: 3, unit: 'g' })
    expect(addQty({ qty: 1, unit: 'L' }, { qty: 1, unit: 'g' })).toBeNull()
  })

  it('computes what is missing', () => {
    expect(missingQty({ qty: 200, unit: 'g' }, { qty: 0.5, unit: 'kg' })).toEqual({ qty: 0.3, unit: 'kg' })
    expect(missingQty({ qty: 6, unit: '' }, { qty: 3, unit: '' })).toEqual({ qty: 0, unit: '' })
    expect(missingQty({ qty: 1, unit: 'L' }, { qty: 3, unit: '' })).toBeNull()
    expect(missingQty({}, { qty: 3, unit: '' })).toBeNull()
  })
})
