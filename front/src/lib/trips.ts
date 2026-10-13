import { addDays } from './frequency'
import { parseEntry } from './quantity'
import { matchKey, sameItem } from './shopping'

export type PackCategory = 'papiers' | 'vetements' | 'toilette' | 'sante' | 'electronique' | 'divers'

export const PACK_CATEGORIES: Record<PackCategory, { label: string; icon: string }> = {
  papiers: { label: 'Papiers & argent', icon: '🪪' },
  vetements: { label: 'Vêtements', icon: '👕' },
  toilette: { label: 'Toilette', icon: '🧴' },
  sante: { label: 'Santé', icon: '💊' },
  electronique: { label: 'Électronique', icon: '🔌' },
  divers: { label: 'Divers', icon: '🎒' },
}

export type TripTag = 'avion' | 'train' | 'voiture' | 'etranger' | 'plage' | 'montagne' | 'ville' | 'business' | 'sport'

export const TRIP_TAGS: Record<TripTag, { label: string; icon: string }> = {
  avion: { label: 'Avion', icon: '✈️' },
  train: { label: 'Train', icon: '🚆' },
  voiture: { label: 'Voiture', icon: '🚗' },
  etranger: { label: 'Étranger', icon: '🌍' },
  plage: { label: 'Plage', icon: '🏖️' },
  montagne: { label: 'Montagne / rando', icon: '⛰️' },
  ville: { label: 'Ville', icon: '🏙️' },
  business: { label: 'Business', icon: '💼' },
  sport: { label: 'Sport', icon: '🏃' },
}

export interface PackItem {
  id: string
  name: string
  category: PackCategory
  qty?: number
  /** In the bag on the way out. */
  out: boolean
  /** Back in the bag before going home. */
  back: boolean
}

export interface Trip {
  id: string
  name: string
  start?: string
  end?: string
  tags: TripTag[]
  items: PackItem[]
}

export type Phase = 'out' | 'back'

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/** Nights between start and end; 3 when dates are missing. */
export function nights(trip: Pick<Trip, 'start' | 'end'>): number {
  if (!trip.start || !trip.end) return 3
  const ms = new Date(`${trip.end}T00:00:00`).getTime() - new Date(`${trip.start}T00:00:00`).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

type Template = [name: string, category: PackCategory, qty?: (nights: number) => number]

// One per day (plus a spare), but no more than a week: beyond that, laundry.
const perDay = (n: number) => Math.min(n + 1, 7)

const BASE: Template[] = [
  ['Carte d’identité', 'papiers'],
  ['Carte bancaire', 'papiers'],
  ['Carte Vitale', 'papiers'],
  ['Billets / réservations', 'papiers'],
  ['Clés de l’appartement', 'papiers'],
  ['Sous-vêtements', 'vetements', perDay],
  ['Chaussettes', 'vetements', perDay],
  ['T-shirts', 'vetements', perDay],
  ['Pantalons', 'vetements', (n) => Math.min(3, Math.ceil((n + 1) / 3))],
  ['Pull', 'vetements'],
  ['Pyjama', 'vetements'],
  ['Chaussures confortables', 'vetements'],
  ['Brosse à dents', 'toilette'],
  ['Dentifrice', 'toilette'],
  ['Déodorant', 'toilette'],
  ['Gel douche', 'toilette'],
  ['Shampoing', 'toilette'],
  ['Rasoir', 'toilette'],
  ['Médicaments perso', 'sante'],
  ['Paracétamol', 'sante'],
  ['Pansements', 'sante'],
  ['Téléphone', 'electronique'],
  ['Chargeur téléphone', 'electronique'],
  ['Batterie externe', 'electronique'],
  ['Écouteurs', 'electronique'],
  ['Sac pour le linge sale', 'divers'],
  ['Gourde', 'divers'],
]

const BY_TAG: Record<TripTag, Template[]> = {
  avion: [
    ['Carte d’embarquement', 'papiers'],
    ['Sac transparent liquides (≤ 100 ml)', 'toilette'],
    ['Coussin de voyage', 'divers'],
  ],
  train: [['Livre / liseuse', 'divers']],
  voiture: [
    ['Permis de conduire', 'papiers'],
    ['Carte grise + attestation d’assurance', 'papiers'],
    ['Chargeur allume-cigare', 'electronique'],
    ['Lunettes de soleil', 'divers'],
  ],
  etranger: [
    ['Passeport (validité ≥ 6 mois)', 'papiers'],
    ['Carte européenne d’assurance maladie', 'papiers'],
    ['Copie des papiers (photo + papier)', 'papiers'],
    ['Carte bancaire sans frais à l’étranger', 'papiers'],
    ['Adaptateur de prise', 'electronique'],
  ],
  plage: [
    ['Maillot de bain', 'vetements'],
    ['Tongs', 'vetements'],
    ['Chapeau / casquette', 'vetements'],
    ['Crème solaire', 'toilette'],
    ['Après-soleil', 'toilette'],
    ['Serviette de plage', 'divers'],
    ['Lunettes de soleil', 'divers'],
  ],
  montagne: [
    ['Chaussures de rando', 'vetements'],
    ['Veste imperméable', 'vetements'],
    ['Polaire', 'vetements'],
    ['Bonnet + gants', 'vetements'],
    ['Lampe frontale', 'electronique'],
    ['Crème solaire', 'toilette'],
    ['Sac à dos de jour', 'divers'],
  ],
  ville: [
    ['Chaussures de marche', 'vetements'],
    ['Petit sac à dos', 'divers'],
    ['Parapluie', 'divers'],
  ],
  business: [
    ['Ordinateur + chargeur', 'electronique'],
    ['Tenue pro', 'vetements'],
    ['Carnet + stylo', 'divers'],
  ],
  sport: [
    ['Tenue de sport', 'vetements'],
    ['Baskets', 'vetements'],
  ],
}

/** Packing list for a trip: basics + items for each tag, clothes sized to the number of nights. */
export function generateItems(tags: TripTag[], n: number): PackItem[] {
  const items: PackItem[] = []
  for (const [name, category, qty] of [...BASE, ...tags.flatMap((t) => BY_TAG[t])]) {
    if (items.some((i) => sameItem(i.name, name))) continue
    items.push({ id: newId('pack'), name, category, qty: qty?.(n), out: false, back: false })
  }
  return items
}

export function createTrip(fields: Pick<Trip, 'name' | 'start' | 'end' | 'tags'>): Trip {
  return { ...fields, id: newId('trip'), items: generateItems(fields.tags, nights(fields)) }
}

/** Same list for a new trip, everything unchecked. */
export function duplicateTrip(trip: Trip, name: string): Trip {
  return {
    ...trip,
    id: newId('trip'),
    name,
    start: undefined,
    end: undefined,
    items: trip.items.map((i) => ({ ...i, id: newId('pack'), out: false, back: false })),
  }
}

const CATEGORY_WORDS: Record<Exclude<PackCategory, 'divers'>, string[]> = {
  papiers: [
    'passeport',
    'carte d identite',
    'carte bancaire',
    'cb',
    'carte vitale',
    'carte d embarquement',
    'billet',
    'permis',
    'reservation',
    'assurance',
    'visa',
    'cle',
    'especes',
    'argent',
    'devise',
  ],
  vetements: [
    't-shirt',
    'tee-shirt',
    'pantalon',
    'jean',
    'short',
    'chaussette',
    'slip',
    'culotte',
    'calecon',
    'boxer',
    'soutien-gorge',
    'pull',
    'sweat',
    'veste',
    'manteau',
    'robe',
    'jupe',
    'chemise',
    'maillot',
    'pyjama',
    'chaussure',
    'basket',
    'sandale',
    'tong',
    'bonnet',
    'gant',
    'echarpe',
    'casquette',
    'chapeau',
    'ceinture',
  ],
  toilette: [
    'brosse',
    'dentifrice',
    'savon',
    'gel douche',
    'shampoing',
    'deodorant',
    'rasoir',
    'creme',
    'parfum',
    'peigne',
    'coton',
    'maquillage',
    'demaquillant',
    'lentille',
    'serviette',
  ],
  sante: ['medicament', 'doliprane', 'paracetamol', 'pansement', 'ordonnance', 'lunettes de vue', 'bouchon'],
  electronique: [
    'chargeur',
    'cable',
    'ordinateur',
    'pc',
    'telephone',
    'ecouteur',
    'casque',
    'batterie',
    'adaptateur',
    'appareil photo',
    'liseuse',
    'kindle',
    'montre',
    'tablette',
    'console',
  ],
}

export function guessPackCategory(name: string): PackCategory {
  const words = ` ${matchKey(name).replace(/'/g, ' ')} `
  const hit = (Object.entries(CATEGORY_WORDS) as [PackCategory, string[]][]).find(([, list]) =>
    list.some((w) => words.includes(` ${matchKey(w)} `)),
  )
  return hit?.[0] ?? 'divers'
}

/** Quick add: "3 t-shirts" → T-shirts ×3 in Vêtements. Ignores duplicates. */
export function addPackItem(trip: Trip, text: string): Trip {
  const { name, qty } = parseEntry(text)
  if (!name || trip.items.some((i) => sameItem(i.name, name))) return trip
  const item: PackItem = {
    id: newId('pack'),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category: guessPackCategory(name),
    qty,
    out: false,
    back: false,
  }
  return { ...trip, items: [...trip.items, item] }
}

/** On the way back, only what actually left home (everything if nothing was ticked). */
export function itemsFor(trip: Trip, phase: Phase): PackItem[] {
  if (phase === 'out') return trip.items
  const packed = trip.items.filter((i) => i.out)
  return packed.length ? packed : trip.items
}

export function progress(trip: Trip, phase: Phase): { done: number; total: number } {
  const items = itemsFor(trip, phase)
  return { done: items.filter((i) => i[phase]).length, total: items.length }
}

/** Upcoming or ongoing first (soonest first), then past ones (most recent first). */
export function sortTrips(trips: Trip[], today: string): Trip[] {
  const isPast = (t: Trip) => !!t.end && t.end < today
  const key = (t: Trip) => t.start ?? addDays(today, 10_000)
  return [...trips].sort((a, b) => {
    if (isPast(a) !== isPast(b)) return isPast(a) ? 1 : -1
    return isPast(a) ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))
  })
}
