import type { Category, Frequency } from '../data/tasks'
import { CATEGORIES, FREQUENCIES } from '../data/tasks'

export type GroupBy = 'urgence' | 'frequence' | 'categorie'

export interface FilterState {
  groupBy: GroupBy
  category: Category | null
  frequency: Frequency | null
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

export function Filters({ value, onChange }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

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
