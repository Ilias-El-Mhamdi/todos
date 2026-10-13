export type Unit = '' | 'g' | 'kg' | 'ml' | 'cl' | 'L'

export const UNITS: Unit[] = ['', 'g', 'kg', 'ml', 'cl', 'L']

export interface Quantity {
  qty?: number
  unit?: Unit
}

export interface Entry extends Quantity {
  name: string
  /** Kitchen measure kept for display only ("2 gousses", "1 c. à soupe"); not compared nor bought. */
  measure?: string
}

const UNIT_ALIASES: Record<string, Unit> = { g: 'g', gr: 'g', kg: 'kg', ml: 'ml', cl: 'cl', l: 'L', x: '' }
const NUMBER = '(\\d+(?:[.,]\\d+)?)'
const UNIT = '(kg|gr|g|ml|cl|l|x)?'
// "2 lait", "500 g de farine", "1,5 L lait", "x3 citrons"
const LEADING = new RegExp(`^(?:x\\s*)?${NUMBER}\\s*${UNIT}\\.?\\s+(?:(?:de|d')\\s*)?(.+)$`, 'i')
// "lait x2", "farine 500g", "citrons 3"
const TRAILING = new RegExp(`^(.+?)\\s+(?:x\\s*)?${NUMBER}\\s*${UNIT}$`, 'i')

const toNumber = (text: string) => Number(text.replace(',', '.'))

// "pincée de sel", "2 gousses d'ail", "1 c. à soupe d'huile"…
const MEASURE = new RegExp(
  "^((?:\\d+(?:[.,]\\d+)?\\s+)?(?:pinc[ée]es?|cuill[eè]res?(?: à (?:soupe|café))?|c\\.? ?à ?(?:soupe|café|[sc]\\.?)|gousses?|tranches?|branches?|brins?|feuilles?|sachets?|bo[iî]tes?|verres?|tasses?|bols?|poign[ée]es?|filet))\\s+(?:de |d'|d’)?(.+)$",
  'i',
)

/** Splits "500 g de farine" into { name: 'farine', qty: 500, unit: 'g' }. */
export function parseEntry(text: string): Entry {
  const clean = text.trim().replace(/\s+/g, ' ')
  const measure = MEASURE.exec(clean)
  if (measure) return { name: measure[2].trim(), measure: measure[1] }
  const lead = LEADING.exec(clean)
  if (lead) return withQty(lead[3], lead[1], lead[2])
  const trail = TRAILING.exec(clean)
  if (trail) return withQty(trail[1], trail[2], trail[3])
  return { name: clean }
}

function withQty(name: string, qty: string, unit: string | undefined): Entry {
  const value = toNumber(qty)
  if (!value) return { name: name.trim() }
  return { name: name.trim(), qty: value, unit: UNIT_ALIASES[(unit ?? '').toLowerCase()] ?? '' }
}

export function formatQty({ qty, unit }: Quantity): string {
  if (qty === undefined) return ''
  const n = qty.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  return unit ? `${n} ${unit}` : `×${n}`
}

type Dimension = 'count' | 'mass' | 'volume'

const BASE: Record<Unit, [Dimension, number]> = {
  '': ['count', 1],
  g: ['mass', 1],
  kg: ['mass', 1000],
  ml: ['volume', 1],
  cl: ['volume', 10],
  L: ['volume', 1000],
}

function toBase({ qty = 0, unit = '' }: Quantity): [Dimension, number] {
  const [dim, factor] = BASE[unit]
  return [dim, qty * factor]
}

function fromBase(value: Quantity['unit'], base: number): number {
  return Math.round((base / BASE[value ?? ''][1]) * 100) / 100
}

/** a + b in a's unit; null when units aren't comparable (e.g. g + L). */
export function addQty(a: Quantity, b: Quantity): Quantity | null {
  if (a.qty === undefined) return b.qty === undefined ? {} : { ...b }
  if (b.qty === undefined) return { ...a }
  const [dimA, baseA] = toBase(a)
  const [dimB, baseB] = toBase(b)
  if (dimA !== dimB) return null
  return { qty: fromBase(a.unit, baseA + baseB), unit: a.unit ?? '' }
}

/** need - have, in need's unit; null when not comparable. Never negative. */
export function missingQty(have: Quantity, need: Quantity): Quantity | null {
  if (have.qty === undefined || need.qty === undefined) return null
  const [dimH, baseH] = toBase(have)
  const [dimN, baseN] = toBase(need)
  if (dimH !== dimN) return null
  return { qty: fromBase(need.unit, Math.max(0, baseN - baseH)), unit: need.unit ?? '' }
}
