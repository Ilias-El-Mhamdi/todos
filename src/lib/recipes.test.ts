import { describe, expect, it } from 'vitest'
import { addChecksToList, checkRecipe, formatIngredients, parseIngredients, scaleRecipe } from './recipes'
import type { ShoppingState } from './shopping'
import { EMPTY_SHOPPING, addItem, addStock, updateStock } from './shopping'

function stockWith(...entries: [name: string, patch: object][]): ShoppingState {
  return entries.reduce((s, [name, patch]) => {
    const next = addStock(s, name)
    return updateStock(next, next.stock[next.stock.length - 1].id, patch)
  }, EMPTY_SHOPPING)
}

describe('parseIngredients / formatIngredients', () => {
  it('parses one ingredient per line and round-trips', () => {
    const ingredients = parseIngredients('- 200 g pâtes\n2 œufs\n\nsel\n1 pincée de muscade')
    expect(ingredients).toEqual([
      { name: 'pâtes', qty: 200, unit: 'g' },
      { name: 'œufs', qty: 2, unit: '' },
      { name: 'sel' },
      { name: 'muscade', measure: '1 pincée' },
    ])
    expect(formatIngredients(ingredients)).toBe('200 g pâtes\n2 œufs\nsel\n1 pincée muscade')
    expect(parseIngredients(formatIngredients(ingredients))).toEqual(ingredients)
  })
})

describe('scaleRecipe', () => {
  const recipe = {
    id: 'r',
    name: 'Crêpes',
    servings: 4,
    ingredients: parseIngredients('250 g farine\n3 œufs\n0,5 L lait\n1 pincée de sel\nbeurre'),
  }

  it('scales quantities and measures', () => {
    const scaled = scaleRecipe(recipe, 6)
    expect(scaled.servings).toBe(6)
    expect(scaled.ingredients).toEqual([
      { name: 'farine', qty: 375, unit: 'g' },
      { name: 'œufs', qty: 4.5, unit: '' },
      { name: 'lait', qty: 0.75, unit: 'L' },
      { name: 'sel', measure: '1,5 pincée' },
      { name: 'beurre' },
    ])
  })

  it('rounds down sensibly and keeps the original for the same servings', () => {
    expect(scaleRecipe(recipe, 1).ingredients.slice(0, 2)).toEqual([
      { name: 'farine', qty: 63, unit: 'g' },
      { name: 'œufs', qty: 1, unit: '' },
    ])
    expect(scaleRecipe(recipe, 4)).toBe(recipe)
  })

  it('buys whole pieces when a scaled recipe needs half of one', () => {
    let shopping = stockWith(['Oeufs', { qty: 4 }])
    const checks = checkRecipe(shopping, scaleRecipe(recipe, 6))
    shopping = addChecksToList(shopping, checks.filter((c) => c.ingredient.name === 'œufs'))
    expect(shopping.items[0]).toMatchObject({ name: 'Œufs', qty: 1, unit: '' })
  })

  it('treats a recipe without servings as for one person', () => {
    const solo = { id: 's', name: 'Omelette', ingredients: parseIngredients('3 œufs') }
    expect(scaleRecipe(solo, 2).ingredients[0].qty).toBe(6)
  })
})

describe('checkRecipe', () => {
  const recipe = {
    id: 'r',
    name: 'Carbo',
    ingredients: parseIngredients('200 g pâtes\n3 œufs\n100 g lardons\nparmesan\npoivre'),
  }

  it('compares counted stock precisely and falls back to levels', () => {
    const shopping = stockWith(
      ['Pâtes', { qty: 500, unit: 'g' }],
      ['Oeufs', { qty: 2 }],
      ['Lardons', { qty: 0 }],
      ['Parmesan', { level: 'bas' }],
    )
    const checks = checkRecipe(shopping, recipe)
    expect(checks.map((c) => [c.ingredient.name, c.status, c.toBuy])).toEqual([
      ['pâtes', 'ok', {}],
      ['œufs', 'low', { qty: 1, unit: '' }],
      ['lardons', 'missing', { qty: 100, unit: 'g' }],
      ['parmesan', 'low', { qty: undefined, unit: undefined }],
      ['poivre', 'unknown', { qty: undefined, unit: undefined }],
    ])
  })

  it('treats incomparable units by level', () => {
    const shopping = stockWith(['Pâtes', { qty: 2 }])
    expect(checkRecipe(shopping, recipe)[0].status).toBe('ok')
  })

  it('flags ingredients already on the list and adds the shortfall', () => {
    let shopping = stockWith(['Oeufs', { qty: 2 }])
    shopping = addItem(shopping, 'Poivre')
    const checks = checkRecipe(shopping, recipe)
    expect(checks.find((c) => c.ingredient.name === 'poivre')?.onList).toBe(true)
    const next = addChecksToList(shopping, checks.filter((c) => c.ingredient.name === 'œufs'))
    expect(next.items.find((i) => i.name === 'Œufs')).toMatchObject({ qty: 1, unit: '' })
  })
})
