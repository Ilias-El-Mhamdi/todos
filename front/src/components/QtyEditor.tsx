import type { Quantity, Unit } from '../lib/quantity'
import { UNITS } from '../lib/quantity'

interface Props {
  value: Quantity
  onChange: (value: Quantity) => void
  label?: string
}

const UNIT_LABELS: Record<Unit, string> = { '': 'pièce(s)', g: 'g', kg: 'kg', ml: 'ml', cl: 'cl', L: 'L' }

/** Number + unit; an empty number clears the quantity. */
export function QtyEditor({ value, onChange, label = 'Quantité' }: Props) {
  return (
    <span className="qty-editor">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        placeholder="—"
        aria-label={label}
        value={value.qty ?? ''}
        onChange={(e) => {
          const qty = e.target.value === '' ? undefined : Math.max(0, Number(e.target.value))
          onChange({ qty, unit: qty === undefined ? undefined : (value.unit ?? '') })
        }}
      />
      <select
        aria-label="Unité"
        value={value.unit ?? ''}
        onChange={(e) => onChange({ qty: value.qty ?? 1, unit: e.target.value as Unit })}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {UNIT_LABELS[u]}
          </option>
        ))}
      </select>
    </span>
  )
}
