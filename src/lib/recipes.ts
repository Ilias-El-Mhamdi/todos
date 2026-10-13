import type { Entry, Quantity } from './quantity'
import { formatQty, missingQty, parseEntry } from './quantity'
import type { ShoppingState, StockItem } from './shopping'
import { addItem, findStock, isOnList, stockLevel } from './shopping'

export interface Recipe {
  id: string
  name: string
  servings?: number
  ingredients: Entry[]
  steps?: string
}

/** ok: enough at home · low: some, maybe not enough · missing: none · unknown: not tracked in the stock. */
export type Availability = 'ok' | 'low' | 'missing' | 'unknown'

export const AVAILABILITY: Record<Availability, { label: string; icon: string }> = {
  ok: { label: 'Dispo', icon: '✅' },
  low: { label: 'Pas assez', icon: '⚠️' },
  missing: { label: 'Manquant', icon: '❌' },
  unknown: { label: 'Pas dans le stock', icon: '❔' },
}

export interface IngredientCheck {
  ingredient: Entry
  status: Availability
  stock?: StockItem
  /** What to buy: the shortfall when it can be computed, else the recipe quantity. */
  toBuy: Quantity
  onList: boolean
}

export function newRecipeId(): string {
  return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function parseIngredients(text: string): Entry[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
    .map(parseEntry)
}

export function formatIngredients(ingredients: Entry[]): string {
  return ingredients
    .map((i) => {
      if (i.measure) return `${i.measure} ${i.name}`
      return i.qty !== undefined ? `${formatQty(i).replace('×', '')} ${i.name}` : i.name
    })
    .join('\n')
}

export function checkIngredient(shopping: ShoppingState, ingredient: Entry): IngredientCheck {
  const stock = findStock(shopping, ingredient.name)
  const onList = isOnList(shopping, ingredient.name)
  const need: Quantity = { qty: ingredient.qty, unit: ingredient.unit }
  if (!stock) return { ingredient, status: 'unknown', toBuy: need, onList }

  // Counted stock and a recipe quantity in comparable units: compare precisely.
  if (stock.qty !== undefined && ingredient.qty !== undefined) {
    const short = missingQty({ qty: stock.qty, unit: stock.unit ?? '' }, need)
    if (short) {
      if (!short.qty) return { ingredient, status: 'ok', stock, toBuy: {}, onList }
      return { ingredient, status: stock.qty > 0 ? 'low' : 'missing', stock, toBuy: short, onList }
    }
  }

  const level = stockLevel(stock)
  const status: Availability = level === 'ok' ? 'ok' : level === 'bas' ? 'low' : 'missing'
  return { ingredient, status, stock, toBuy: status === 'ok' ? {} : need, onList }
}

export function checkRecipe(shopping: ShoppingState, recipe: Recipe): IngredientCheck[] {
  return recipe.ingredients.map((i) => checkIngredient(shopping, i))
}

/** Rounds to what makes sense in a kitchen: half pieces, whole grams/ml, 2 decimals for kg/L. */
function roundQty(value: number, unit: Entry['unit']): number {
  if (!unit) return Math.max(0.5, Math.round(value * 2) / 2)
  if (unit === 'kg' || unit === 'L') return Math.round(value * 100) / 100
  return Math.max(1, Math.round(value))
}

/** Scales ingredient quantities (and the number in kitchen measures) to a number of servings. */
export function scaleRecipe(recipe: Recipe, servings: number): Recipe {
  const base = recipe.servings ?? 1
  const factor = servings / base
  if (factor === 1) return recipe
  return {
    ...recipe,
    servings,
    ingredients: recipe.ingredients.map((i) => {
      if (i.measure) {
        const measure = i.measure.replace(/^(\d+(?:[.,]\d+)?)/, (n) =>
          String(roundQty(Number(n.replace(',', '.')) * factor, '')).replace('.', ','),
        )
        return { ...i, measure }
      }
      return i.qty !== undefined ? { ...i, qty: roundQty(i.qty * factor, i.unit) } : i
    }),
  }
}

export function addChecksToList(shopping: ShoppingState, checks: IngredientCheck[]): ShoppingState {
  const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)
  // Pieces are bought whole: 0.5 egg missing means buying 1.
  const purchase = ({ qty, unit }: Quantity): Quantity =>
    qty !== undefined && !unit ? { qty: Math.ceil(qty), unit } : { qty, unit }
  return checks.reduce((s, c) => addItem(s, capitalize(c.ingredient.name), undefined, purchase(c.toBuy)), shopping)
}

export const EXAMPLE_RECIPES: Omit<Recipe, 'id'>[] = [
  {
    name: 'Pâtes carbonara',
    servings: 2,
    ingredients: parseIngredients('200 g pâtes\n100 g lardons\n2 œufs\n50 g parmesan\npoivre'),
    steps:
      'Cuire les pâtes. Faire dorer les lardons. Battre œufs + parmesan + poivre. Mélanger hors du feu avec un peu d’eau de cuisson.',
  },
  {
    name: 'Omelette aux champignons',
    servings: 1,
    ingredients: parseIngredients('3 œufs\n150 g champignons\n10 g beurre\nsel\npoivre'),
    steps: 'Faire revenir les champignons au beurre. Battre les œufs, saler, poivrer, verser et cuire à feu doux.',
  },
]
