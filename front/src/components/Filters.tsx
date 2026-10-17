import type { Category, Frequency, Priority } from '../data/tasks'
import { CATEGORIES, FREQUENCIES, PRIORITIES } from '../data/tasks'

export type GroupBy = 'urgence' | 'frequence' | 'categorie'

/** A priority, or 'none' for tasks without one. */
export type PriorityFilter = Priority | 'none'

export interface FilterState {
  groupBy: GroupBy
  category: Category | null
  frequency: Frequency | null
  /** Empty = all priorities. */
  priorities: PriorityFilter[]
  search: string
  showHidden: boolean
}

interface Props {
  value: FilterState
  onChange: (value: FilterState) => void
}

const GROUPS: Record<GroupBy, string> = {
  urgence: 'Urgence',
  frequence: 'Fréquence',
  categorie: 'Catégorie',
}

const PRIORITY_FILTERS: PriorityFilter[] = [...PRIORITIES, 'none']

export function Filters({ value, onChange }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })
  const togglePriority = (p: PriorityFilter) =>
    set({
      priorities: value.priorities.includes(p) ? value.priorities.filter((x) => x !== p) : [...value.priorities, p],
    })

  return (
    <div className="filters">
      <div className="tabs" role="tablist">
        {(Object.keys(GROUPS) as GroupBy[]).map((g) => (
          <button key={g} role="tab" aria-selected={value.groupBy === g} onClick={() => set({ groupBy: g })}>
            {GROUPS[g]}
          </button>
        ))}
      </div>

      <div className="chips">
        <button className={`chip${value.category === null ? ' active' : ''}`} onClick={() => set({ category: null })}>
          Tout
        </button>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <button
            key={c}
            className={`chip cat-${c}${value.category === c ? ' active' : ''}`}
            onClick={() => set({ category: value.category === c ? null : c })}
          >
            {CATEGORIES[c].icon} {CATEGORIES[c].label}
          </button>
        ))}
      </div>

      <div className="chips priority-filter" role="group" aria-label="Priorité">
        <button className={`chip${value.priorities.length === 0 ? ' active' : ''}`} onClick={() => set({ priorities: [] })}>
          Toutes priorités
        </button>
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={p}
            className={`chip${p === 'none' ? '' : ` priority-${p}`}${value.priorities.includes(p) ? ' active' : ''}`}
            aria-pressed={value.priorities.includes(p)}
            onClick={() => togglePriority(p)}
          >
            {p === 'none' ? 'Sans' : `P${p}`}
          </button>
        ))}
      </div>

      <div className="row">
        <input
          type="search"
          placeholder="Rechercher…"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
        />
        <select
          value={value.frequency ?? ''}
          onChange={(e) => set({ frequency: (e.target.value || null) as Frequency | null })}
        >
          <option value="">Toutes fréquences</option>
          {(Object.keys(FREQUENCIES) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCIES[f]}
            </option>
          ))}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={value.showHidden} onChange={(e) => set({ showHidden: e.target.checked })} />
          Masquées
        </label>
      </div>
    </div>
  )
}
