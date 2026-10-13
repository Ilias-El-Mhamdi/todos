import { useState, type ReactNode } from 'react'
import type { Aisle, ShoppingItem, ShoppingState } from '../lib/shopping'
import { AISLES, addItem, clearChecked, forget, setAisle, setItemQty, stockLevel, suggestions } from '../lib/shopping'
import { formatQty, parseEntry } from '../lib/quantity'
import { QtyEditor } from './QtyEditor'
import { StockView } from './StockView'
import { useLocalStorage } from '../lib/storage'

interface Props {
  shopping: ShoppingState
  update: (fn: (s: ShoppingState) => ShoppingState) => void
}

type View = 'liste' | 'stock' | 'recettes'

/** Courses tab: shopping list, stock and recipes (rendered by the parent, which owns them). */
export function ShoppingPage({ shopping, update, recipes }: Props & { recipes: ReactNode }) {
  const [view, setView] = useLocalStorage<View>('entretien.coursesView', 'liste')
  const missingCount = shopping.stock.filter((st) => stockLevel(st) !== 'ok').length

  return (
    <div className="shopping-page">
      <div className="tabs view-switch" role="tablist">
        <button role="tab" aria-selected={view === 'liste'} onClick={() => setView('liste')}>
          🛒 Liste
        </button>
        <button role="tab" aria-selected={view === 'stock'} onClick={() => setView('stock')}>
          🏠 Stock{missingCount > 0 && <span className="tab-badge warn">{missingCount}</span>}
        </button>
        <button role="tab" aria-selected={view === 'recettes'} onClick={() => setView('recettes')}>
          🍳 Recettes
        </button>
      </div>
      {view === 'liste' && <ShoppingList shopping={shopping} update={update} />}
      {view === 'stock' && <StockView shopping={shopping} update={update} />}
      {view === 'recettes' && recipes}
    </div>
  )
}

function ShoppingList({ shopping, update }: Props) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const pending = shopping.items.filter((i) => !i.checked)
  const basket = shopping.items.filter((i) => i.checked)
  const matches = query.trim() ? suggestions(shopping, query, 5) : []
  const frequent = query.trim() ? [] : suggestions(shopping, '', 10)

  const add = (name: string, aisle?: Aisle) => {
    update((s) => addItem(s, name, aisle))
    setQuery('')
  }

  // "2 lait", "500 g farine", "lait x2"…
  const addTyped = (text: string) => {
    const { name, ...quantity } = parseEntry(text)
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
    update((s) => addItem(s, capitalized, undefined, quantity))
    setQuery('')
  }

  const toggle = (id: string) =>
    update((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }))

  const remove = (id: string) => update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))

  const clearAll = () => {
    if (window.confirm('Vider toute la liste ? (l’historique est conservé)')) update((s) => ({ ...s, items: [] }))
  }

  const byAisle = (Object.keys(AISLES) as Aisle[])
    .map((aisle) => ({ aisle, items: pending.filter((i) => i.aisle === aisle) }))
    .filter((g) => g.items.length)

  const renderItem = (item: ShoppingItem) => (
    <li key={item.id} className={`shop-item${item.checked ? ' done' : ''}${editingId === item.id ? ' editing' : ''}`}>
      <button
        className={`check round${item.checked ? ' checked' : ''}`}
        onClick={() => toggle(item.id)}
        aria-label={item.checked ? 'Remettre dans la liste' : 'Mettre dans le panier'}
      >
        {item.checked ? '✓' : ''}
      </button>
      <button
        className="shop-name stock-name"
        onClick={() => setEditingId(editingId === item.id ? null : item.id)}
        aria-expanded={editingId === item.id}
        title="Modifier la quantité"
      >
        {item.name}
        {item.qty !== undefined && <span className="qty-badge">{formatQty(item)}</span>}
      </button>
      {!item.checked && (
        // Compact icon button; the transparent native select on top opens the system picker.
        <label className="aisle-picker" title="Changer de rayon">
          <span aria-hidden>{AISLES[item.aisle].icon}▾</span>
          <select
            value={item.aisle}
            onChange={(e) => update((s) => setAisle(s, item.id, e.target.value as Aisle))}
            aria-label="Rayon"
          >
            {(Object.keys(AISLES) as Aisle[]).map((a) => (
              <option key={a} value={a}>
                {AISLES[a].icon} {AISLES[a].label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="remove" onClick={() => remove(item.id)} aria-label="Supprimer" title="Supprimer">
        ✕
      </button>
      {editingId === item.id && (
        <div className="item-editor">
          <QtyEditor value={item} onChange={(q) => update((s) => setItemQty(s, item.id, q))} />
          <button className="secondary" onClick={() => setEditingId(null)}>
            OK
          </button>
        </div>
      )}
    </li>
  )

  return (
    <>
      <div className="today-head">
        <h2>Courses</h2>
        {shopping.items.length > 0 && (
          <span className="today-count">
            {pending.length} article{pending.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="quick-add">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addTyped(query)
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ajouter… (ex. 2 lait, 500 g farine)"
            aria-label="Ajouter un article"
            enterKeyHint="done"
          />
          <button type="submit" className="primary" aria-label="Ajouter" disabled={!query.trim()}>
            +
          </button>
        </form>
        {matches.length > 0 && (
          <ul className="quick-add-results">
            {matches.map((m) => (
              <li key={m.name}>
                <button onClick={() => add(m.name, m.aisle)}>
                  {AISLES[m.aisle].icon} {m.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {frequent.length > 0 && (
        <div className="frequent">
          <div className="frequent-head">
            <span className="frequent-label">Souvent acheté</span>
            <button
              className="link"
              onClick={() => {
                if (window.confirm('Effacer tout l’historique des articles ?')) update((s) => ({ ...s, history: {} }))
              }}
            >
              Tout effacer
            </button>
          </div>
          <div className="chips">
            {frequent.map((f) => (
              <span key={f.name} className="chip frequent-chip">
                <button onClick={() => add(f.name, f.aisle)}>+ {f.name}</button>
                <button
                  className="forget"
                  onClick={() => update((s) => forget(s, f.name))}
                  aria-label={`Retirer ${f.name} des articles fréquents`}
                  title="Retirer des articles fréquents"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {shopping.items.length === 0 && (
        <p className="empty">
          Liste vide.
          <br />
          Les articles sont rangés automatiquement par rayon.
        </p>
      )}

      {pending.length === 0 && basket.length > 0 && <p className="empty">Tout est dans le panier 🎉</p>}

      {byAisle.map((g) => (
        <section key={g.aisle} className="aisle">
          <h3>
            {AISLES[g.aisle].icon} {AISLES[g.aisle].label}
          </h3>
          <ul className="shop-list">{g.items.map(renderItem)}</ul>
        </section>
      ))}

      {basket.length > 0 && (
        <details className="done-section">
          <summary>
            Dans le panier <span className="count">{basket.length}</span>
          </summary>
          <ul className="shop-list">{basket.map(renderItem)}</ul>
        </details>
      )}

      {shopping.items.length > 0 && (
        <div className="shop-actions">
          {basket.length > 0 && (
            <button className="primary" onClick={() => update(clearChecked)}>
              Courses terminées ({basket.length})
            </button>
          )}
          <button className="secondary" onClick={clearAll}>
            Vider la liste
          </button>
        </div>
      )}
    </>
  )
}
