import { useState } from 'react'
import type { Unit } from '../lib/quantity'
import { QtyEditor } from './QtyEditor'
import type { Level, Location, ShoppingState, StockItem } from '../lib/shopping'
import {
  DEFAULT_MIN,
  LEVELS,
  LOCATIONS,
  STARTER_STOCK,
  addMissingToList,
  addStarterStock,
  addStock,
  isOnList,
  normalize,
  sameItem,
  stockLevel,
  updateStock,
} from '../lib/shopping'

interface Props {
  shopping: ShoppingState
  update: (fn: (s: ShoppingState) => ShoppingState) => void
}

type StatusFilter = 'all' | 'missing' | Level

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'missing', label: 'À racheter' },
  { key: 'ok', label: 'OK' },
  { key: 'bas', label: 'Bas' },
  { key: 'vide', label: 'Vide' },
]

const matchesStatus = (st: StockItem, filter: StatusFilter) => {
  const level = stockLevel(st)
  return filter === 'all' || (filter === 'missing' ? level !== 'ok' : level === filter)
}

// Stepper increment per unit: one by one for counts, sensible chunks for weights and volumes.
const STEP: Record<Unit, number> = { '': 1, g: 100, kg: 0.5, ml: 100, cl: 10, L: 0.5 }

export function StockView({ shopping, update }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [location, setLocation] = useState<Location | null>(null)
  // Item whose settings (level vs count, threshold) are open.
  const [openId, setOpenId] = useState<string | null>(null)
  const { stock } = shopping
  const missing = stock.filter((st) => stockLevel(st) !== 'ok')
  const missingNotListed = missing.filter((st) => !isOnList(shopping, st.name))
  // The input both searches the stock and adds a new product.
  const q = normalize(query)
  const searched = q ? stock.filter((st) => normalize(st.name).includes(q)) : stock
  const inLocation = location ? searched.filter((st) => st.location === location) : searched
  const shown = inLocation.filter((st) => matchesStatus(st, status))
  const exists = q !== '' && stock.some((st) => sameItem(st.name, query))
  const filtered = q !== '' || status !== 'all' || location !== null
  const usedLocations = (Object.keys(LOCATIONS) as Location[]).filter((l) => searched.some((st) => st.location === l))

  const resetFilters = () => {
    setQuery('')
    setStatus('all')
    setLocation(null)
  }

  const groups = (Object.keys(LOCATIONS) as Location[])
    .map((l) => ({ location: l, items: shown.filter((st) => st.location === l) }))
    .filter((g) => g.items.length)

  const add = () => {
    update((s) => addStock(s, query))
    setQuery('')
  }

  const set = (id: string, patch: Partial<Omit<StockItem, 'id'>>) => update((s) => updateStock(s, id, patch))

  const startCounting = (st: StockItem) => {
    const min = st.min ?? DEFAULT_MIN
    const qty = { vide: 0, bas: min, ok: min + 1 }[st.level]
    set(st.id, { qty, min })
  }

  const renderItem = (st: StockItem) => {
    const level = stockLevel(st)
    const counted = st.qty !== undefined
    const open = openId === st.id
    return (
      <li key={st.id} className={`stock-entry${open ? ' open' : ''}`}>
        <div className={`shop-item stock-item level-${level}`}>
          <button
            className="shop-name stock-name"
            onClick={() => setOpenId(open ? null : st.id)}
            aria-expanded={open}
            title="Réglages du produit"
          >
            {st.name}
            {level !== 'ok' && isOnList(shopping, st.name) && (
              <span className="on-list" title="Déjà sur la liste de courses">
                🛒
              </span>
            )}
          </button>
          {counted ? (
            <span className={`qty-stepper level-${level}`} role="group" aria-label={`Quantité de ${st.name}`}>
              <button
                onClick={() => set(st.id, { qty: Math.max(0, +(st.qty! - STEP[st.unit ?? '']).toFixed(2)) })}
                aria-label="Retirer un"
                disabled={st.qty === 0}
              >
                −
              </button>
              <span className="qty" aria-live="polite">
                {st.qty!.toLocaleString('fr-FR')}
                {st.unit && <small> {st.unit}</small>}
              </span>
              <button
                onClick={() => set(st.id, { qty: +(st.qty! + STEP[st.unit ?? '']).toFixed(2) })}
                aria-label="Ajouter un"
              >
                +
              </button>
            </span>
          ) : (
            <span className="level-switch" role="group" aria-label={`Niveau de ${st.name}`}>
              {(Object.keys(LEVELS) as Level[]).map((l) => (
                <button
                  key={l}
                  className={`level-${l}`}
                  aria-pressed={st.level === l}
                  onClick={() => set(st.id, { level: l })}
                >
                  {LEVELS[l].label}
                </button>
              ))}
            </span>
          )}
          <label className="aisle-picker" title="Changer de lieu">
            <span aria-hidden>{LOCATIONS[st.location].icon}▾</span>
            <select
              value={st.location}
              onChange={(e) =>
                update((s) =>
                  updateStock(s, st.id, {
                    location: e.target.value as Location,
                  }),
                )
              }
              aria-label="Lieu de rangement"
            >
              {(Object.keys(LOCATIONS) as Location[]).map((l) => (
                <option key={l} value={l}>
                  {LOCATIONS[l].icon} {LOCATIONS[l].label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="remove"
            onClick={() =>
              update((s) => ({
                ...s,
                stock: s.stock.filter((x) => x.id !== st.id),
              }))
            }
            aria-label={`Retirer ${st.name} du stock`}
            title="Retirer du stock"
          >
            ✕
          </button>
        </div>
        {open && (
          <div className="stock-settings">
            <span className="tabs" role="group" aria-label="Mode de suivi">
              <button aria-selected={!counted} onClick={() => counted && set(st.id, { level, qty: undefined })}>
                Niveau
              </button>
              <button aria-selected={counted} onClick={() => !counted && startCounting(st)}>
                Quantité
              </button>
            </span>
            {counted && (
              <label>
                J’en ai
                <QtyEditor
                  value={{ qty: st.qty, unit: st.unit ?? '' }}
                  onChange={(q) => set(st.id, { qty: q.qty ?? 0, unit: q.unit ?? '' })}
                />
              </label>
            )}
            {counted && (
              <label>
                Alerte à
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={st.min ?? DEFAULT_MIN}
                  onChange={(e) =>
                    set(st.id, {
                      min: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
                {st.unit || ''} ou moins
              </label>
            )}
          </div>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="quick-add">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher ou ajouter un produit…"
            aria-label="Rechercher ou ajouter un produit"
            enterKeyHint="done"
          />
          <button type="submit" className="primary" aria-label="Ajouter au stock" disabled={!query.trim() || exists}>
            +
          </button>
        </form>
      </div>

      {stock.length === 0 ? (
        <div className="empty">
          <p>
            Ton stock est vide.
            <br />
            Ajoute ce que tu as chez toi, puis indique pour chaque produit s’il est OK, bas ou vide.
          </p>
          <button className="primary" onClick={() => update(addStarterStock)}>
            Ajouter les essentiels ({STARTER_STOCK.length})
          </button>
        </div>
      ) : (
        <>
          <div className="stock-toolbar">
            <div className="chips" role="group" aria-label="Filtrer par état">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`chip status-chip-${f.key}${status === f.key ? ' active' : ''}`}
                  aria-pressed={status === f.key}
                  onClick={() => setStatus(f.key)}
                >
                  {f.label} ({inLocation.filter((st) => matchesStatus(st, f.key)).length})
                </button>
              ))}
            </div>
            <button
              className="secondary"
              disabled={missingNotListed.length === 0}
              onClick={() => update(addMissingToList)}
            >
              🛒 Ajouter {missingNotListed.length || ''} à la liste
            </button>
          </div>

          {usedLocations.length > 1 && (
            <div className="chips location-chips" role="group" aria-label="Filtrer par lieu">
              {usedLocations.map((l) => (
                <button
                  key={l}
                  className={`chip${location === l ? ' active' : ''}`}
                  aria-pressed={location === l}
                  onClick={() => setLocation(location === l ? null : l)}
                >
                  {LOCATIONS[l].icon} {LOCATIONS[l].label}
                </button>
              ))}
            </div>
          )}

          {q !== '' && !exists && (
            <button className="add-from-search" onClick={add}>
              ＋ Ajouter « {query.trim()} » au stock
            </button>
          )}

          {groups.length === 0 &&
            (status === 'missing' && !q && !location ? (
              <p className="empty">Rien à racheter 🎉</p>
            ) : (
              <p className="empty">
                Aucun produit ne correspond.{' '}
                <button className="link" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              </p>
            ))}

          {filtered && groups.length > 0 && (
            <p className="filter-summary">
              {shown.length} produit{shown.length > 1 ? 's' : ''} sur {stock.length} ·{' '}
              <button className="link" onClick={resetFilters}>
                Réinitialiser
              </button>
            </p>
          )}

          {groups.map((g) => (
            <section key={g.location} className="aisle">
              <h3>
                {LOCATIONS[g.location].icon} {LOCATIONS[g.location].label}
              </h3>
              <ul className="shop-list">{g.items.map(renderItem)}</ul>
            </section>
          ))}

          <p className="footer-note">Après « Courses terminées », les produits achetés repassent à OK.</p>
        </>
      )}
    </>
  )
}
