import type { Quantity, Unit } from './quantity'
import { addQty } from './quantity'

export type Aisle =
  | 'fruits-legumes'
  | 'boulangerie'
  | 'frais'
  | 'epicerie'
  | 'boissons'
  | 'surgeles'
  | 'hygiene'
  | 'entretien'
  | 'autre'

export const AISLES: Record<Aisle, { label: string; icon: string }> = {
  'fruits-legumes': { label: 'Fruits & légumes', icon: '🥕' },
  boulangerie: { label: 'Boulangerie', icon: '🥖' },
  frais: { label: 'Frais', icon: '🧀' },
  epicerie: { label: 'Épicerie', icon: '🥫' },
  boissons: { label: 'Boissons', icon: '🧃' },
  surgeles: { label: 'Surgelés', icon: '🧊' },
  hygiene: { label: 'Hygiène', icon: '🧴' },
  entretien: { label: 'Entretien', icon: '🧽' },
  autre: { label: 'Autre', icon: '🛒' },
}

export interface ShoppingItem extends Quantity {
  id: string
  name: string
  aisle: Aisle
  checked: boolean
}

export interface HistoryEntry {
  name: string
  aisle: Aisle
  /** Number of times bought. */
  count: number
}

export type Location = 'frigo' | 'congelateur' | 'placards' | 'salle-de-bain' | 'menage' | 'cave' | 'autre'

export const LOCATIONS: Record<Location, { label: string; icon: string }> = {
  frigo: { label: 'Frigo', icon: '🧊' },
  congelateur: { label: 'Congélateur', icon: '❄️' },
  placards: { label: 'Placards cuisine', icon: '🥫' },
  'salle-de-bain': { label: 'Salle de bain', icon: '🛁' },
  menage: { label: 'Ménage & maison', icon: '🧽' },
  cave: { label: 'Cave', icon: '📦' },
  autre: { label: 'Autre', icon: '🗂️' },
}

export type Level = 'ok' | 'bas' | 'vide'

export const LEVELS: Record<Level, { label: string; icon: string }> = {
  ok: { label: 'OK', icon: '✅' },
  bas: { label: 'Bas', icon: '⚠️' },
  vide: { label: 'Vide', icon: '❌' },
}

export interface StockItem {
  id: string
  name: string
  location: Location
  /** Manual level, used when the item isn't counted. */
  level: Level
  /** Count, when tracked precisely; the level is then derived from it. */
  qty?: number
  /** Alert threshold for counted items: "bas" at or below it. Defaults to 1. */
  min?: number
  /** Unit of qty (g, L…); empty for a plain count. */
  unit?: Unit
}

export const DEFAULT_MIN = 1

export function stockLevel(st: StockItem): Level {
  if (st.qty === undefined) return st.level
  if (st.qty <= 0) return 'vide'
  return st.qty <= (st.min ?? DEFAULT_MIN) ? 'bas' : 'ok'
}

export interface ShoppingState {
  items: ShoppingItem[]
  /** Previously bought items, by normalized name. */
  history: Record<string, HistoryEntry>
  /** What's at home. */
  stock: StockItem[]
}

export const EMPTY_SHOPPING: ShoppingState = { items: [], history: {}, stock: [] }

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Loose identity for matching items across lists: case, accents and plurals ignored. */
export function matchKey(text: string): string {
  return normalize(text)
    .split(' ')
    .map((w) => (w.length > 3 ? w.replace(/[sx]$/, '') : w))
    .join(' ')
}

export const sameItem = (a: string, b: string) => matchKey(a) === matchKey(b)

const KEYWORDS: Record<Exclude<Aisle, 'autre'>, string[]> = {
  'fruits-legumes': [
    'pomme', 'banane', 'orange', 'citron', 'clementine', 'kiwi', 'poire', 'raisin', 'fraise', 'framboise', 'melon',
    'pasteque', 'ananas', 'mangue', 'avocat', 'salade', 'tomate', 'carotte', 'oignon', 'ail', 'echalote', 'courgette',
    'aubergine', 'poivron', 'pomme de terre', 'patate', 'champignon', 'epinard', 'brocoli', 'chou', 'concombre',
    'haricot vert', 'poireau', 'radis', 'persil', 'basilic', 'coriandre', 'menthe', 'gingembre', 'fruit', 'legume',
  ],
  boulangerie: ['pain', 'baguette', 'brioche', 'croissant', 'pain de mie', 'viennoiserie'],
  frais: [
    'lait', 'beurre', 'yaourt', 'yogourt', 'skyr', 'fromage', 'creme', 'creme fraiche', 'oeuf', 'jambon', 'poulet',
    'dinde', 'viande', 'steak', 'boeuf', 'porc', 'saucisse', 'lardon', 'poisson', 'saumon', 'cabillaud', 'crevette',
    'mozzarella', 'emmental', 'comte', 'chevre', 'feta', 'parmesan', 'tofu', 'houmous', 'pate feuilletee', 'pate brisee',
  ],
  epicerie: [
    'pates', 'spaghetti', 'riz', 'farine', 'sucre', 'sel', 'poivre', 'huile', 'vinaigre', 'cafe', 'the', 'cereales',
    'muesli', 'flocons d avoine', 'conserve', 'thon', 'sardine', 'sauce', 'sauce tomate', 'moutarde', 'ketchup',
    'mayonnaise', 'chocolat', 'biscuit', 'gateau', 'confiture', 'miel', 'lentille', 'pois chiche', 'haricot rouge',
    'epice', 'bouillon', 'chips', 'noix', 'amande', 'compote', 'levure',
  ],
  boissons: ['eau', 'eau gazeuse', 'jus', 'soda', 'coca', 'biere', 'vin', 'sirop', 'limonade'],
  surgeles: ['surgele', 'glace', 'frites', 'pizza', 'legumes surgeles'],
  hygiene: [
    'dentifrice', 'brosse a dents', 'shampoing', 'shampooing', 'apres shampoing', 'gel douche', 'savon', 'deodorant',
    'coton', 'coton tige', 'rasoir', 'mousse a raser', 'papier toilette', 'mouchoir', 'creme solaire', 'fil dentaire',
  ],
  entretien: [
    'lessive', 'adoucissant', 'liquide vaisselle', 'pastille lave vaisselle', 'tablette lave vaisselle', 'eponge',
    'sac poubelle', 'javel', 'nettoyant', 'vinaigre blanc', 'essuie tout', 'sopalin', 'bicarbonate', 'pile', 'ampoule',
  ],
}

// Longest keyword first so "vinaigre blanc" beats "vinaigre" and "pomme de terre" beats "pomme".
const MATCHERS = (Object.entries(KEYWORDS) as [Aisle, string[]][])
  .flatMap(([aisle, words]) => words.map((w) => ({ aisle, word: w })))
  .sort((a, b) => b.word.length - a.word.length)
  .map(({ aisle, word }) => ({ aisle, re: new RegExp(`(^|[^a-z])${word.replace(/ /g, '[ -]?')}(s|x)?($|[^a-z])`) }))

/** Aisle learned from history, else guessed from keywords. */
export function guessAisle(name: string, history: Record<string, HistoryEntry> = {}): Aisle {
  const key = normalize(name)
  if (history[key]) return history[key].aisle
  const text = key.replace(/'/g, ' ')
  return MATCHERS.find((m) => m.re.test(text))?.aisle ?? 'autre'
}

export function newItemId(): string {
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Adds an item, or unchecks it if it's already in the basket. Ignores duplicates. */
/**
 * Adds an item. Already on the list: quantities are summed (when compatible).
 * Already in the basket: it goes back on the list with the new quantity.
 */
export function addItem(state: ShoppingState, rawName: string, aisle?: Aisle, quantity: Quantity = {}): ShoppingState {
  const name = rawName.trim()
  if (!name) return state
  const existing = state.items.find((i) => sameItem(i.name, name))
  if (existing) {
    const next = existing.checked
      ? { ...existing, checked: false, qty: quantity.qty, unit: quantity.unit }
      : { ...existing, ...(addQty(existing, quantity) ?? quantity) }
    return { ...state, items: state.items.map((i) => (i === existing ? next : i)) }
  }
  const item: ShoppingItem = {
    id: newItemId(),
    name,
    aisle: aisle ?? guessAisle(name, state.history),
    checked: false,
    ...(quantity.qty !== undefined && { qty: quantity.qty, unit: quantity.unit ?? '' }),
  }
  return { ...state, items: [...state.items, item] }
}

export function setItemQty(state: ShoppingState, id: string, quantity: Quantity): ShoppingState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, qty: quantity.qty, unit: quantity.unit } : i)),
  }
}

/** Removes checked items, records them in the history and marks them back in stock. */
export function clearChecked(state: ShoppingState): ShoppingState {
  const history = { ...state.history }
  const bought = state.items.filter((i) => i.checked)
  for (const item of bought) {
    const key = normalize(item.name)
    history[key] = { name: item.name, aisle: item.aisle, count: (history[key]?.count ?? 0) + 1 }
  }
  return {
    ...state,
    items: state.items.filter((i) => !i.checked),
    history,
    stock: state.stock.map((st) => {
      const item = bought.find((i) => sameItem(i.name, st.name))
      return item ? restock(st, item) : st
    }),
  }
}

/** Changing an item's aisle teaches it for next time. */
export function setAisle(state: ShoppingState, id: string, aisle: Aisle): ShoppingState {
  const item = state.items.find((i) => i.id === id)
  if (!item) return state
  const key = normalize(item.name)
  const history = state.history[key] ? { ...state.history, [key]: { ...state.history[key], aisle } } : state.history
  return { ...state, items: state.items.map((i) => (i.id === id ? { ...i, aisle } : i)), history }
}

export function forget(state: ShoppingState, name: string): ShoppingState {
  const history = { ...state.history }
  delete history[normalize(name)]
  return { ...state, history }
}

/** Most bought history entries not already on the list, optionally filtered by a query. */
export function suggestions(state: ShoppingState, query = '', limit = 8): HistoryEntry[] {
  const onList = new Set(state.items.filter((i) => !i.checked).map((i) => normalize(i.name)))
  const q = normalize(query)
  return Object.entries(state.history)
    .filter(([key]) => !onList.has(key) && (!q || key.includes(q)))
    .map(([, entry]) => entry)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/**
 * Back to OK after buying. Counted items add the bought quantity when known and compatible,
 * otherwise go just above their threshold.
 */
function restock(st: StockItem, bought: Quantity): StockItem {
  if (st.qty === undefined) return { ...st, level: 'ok' }
  const sum = bought.qty !== undefined ? addQty({ qty: st.qty, unit: st.unit ?? '' }, bought) : null
  if (sum?.qty !== undefined) return { ...st, qty: sum.qty }
  return { ...st, qty: Math.max(st.qty, (st.min ?? DEFAULT_MIN) + 1) }
}

const LOCATION_BY_AISLE: Record<Aisle, Location> = {
  'fruits-legumes': 'placards',
  boulangerie: 'placards',
  frais: 'frigo',
  epicerie: 'placards',
  boissons: 'placards',
  surgeles: 'congelateur',
  hygiene: 'salle-de-bain',
  entretien: 'menage',
  autre: 'autre',
}

export function guessLocation(name: string, history: Record<string, HistoryEntry> = {}): Location {
  return LOCATION_BY_AISLE[guessAisle(name, history)]
}

/** Adds an item to the stock (as OK); ignores duplicates. */
export function addStock(state: ShoppingState, rawName: string, location?: Location, level: Level = 'ok'): ShoppingState {
  const name = rawName.trim()
  if (!name) return state
  if (state.stock.some((st) => sameItem(st.name, name))) return state
  const item: StockItem = { id: newItemId(), name, location: location ?? guessLocation(name, state.history), level }
  return { ...state, stock: [...state.stock, item] }
}

export function updateStock(state: ShoppingState, id: string, patch: Partial<Omit<StockItem, 'id'>>): ShoppingState {
  return { ...state, stock: state.stock.map((st) => (st.id === id ? { ...st, ...patch } : st)) }
}

export function isOnList(state: ShoppingState, name: string): boolean {
  return state.items.some((i) => !i.checked && sameItem(i.name, name))
}

export function findStock(state: ShoppingState, name: string): StockItem | undefined {
  return state.stock.find((st) => sameItem(st.name, name))
}

/** Puts every low or empty stock item on the shopping list. */
export function addMissingToList(state: ShoppingState): ShoppingState {
  return state.stock
    .filter((st) => stockLevel(st) !== 'ok')
    .reduce((s, st) => addItem(s, st.name), state)
}

/** Everyday basics for a one-bedroom flat. */
export const STARTER_STOCK: [name: string, location: Location][] = [
  ['Lait', 'frigo'],
  ['Beurre', 'frigo'],
  ['Œufs', 'frigo'],
  ['Pâtes', 'placards'],
  ['Riz', 'placards'],
  ['Huile d’olive', 'placards'],
  ['Sel', 'placards'],
  ['Poivre', 'placards'],
  ['Café', 'placards'],
  ['Sucre', 'placards'],
  ['Conserves de tomates', 'placards'],
  ['Papier toilette', 'salle-de-bain'],
  ['Dentifrice', 'salle-de-bain'],
  ['Gel douche', 'salle-de-bain'],
  ['Shampoing', 'salle-de-bain'],
  ['Déodorant', 'salle-de-bain'],
  ['Paracétamol', 'salle-de-bain'],
  ['Pansements', 'salle-de-bain'],
  ['Lessive', 'menage'],
  ['Liquide vaisselle', 'menage'],
  ['Pastilles lave-vaisselle', 'menage'],
  ['Éponges', 'menage'],
  ['Sacs poubelle', 'menage'],
  ['Essuie-tout', 'menage'],
  ['Piles', 'menage'],
  ['Ampoules', 'cave'],
]

export function addStarterStock(state: ShoppingState): ShoppingState {
  return STARTER_STOCK.reduce((s, [name, location]) => addStock(s, name, location), state)
}
