import { useRef, useState, type PointerEvent } from 'react'
import { moveTo } from './today'

/**
 * Pointer-based drag to reorder a list (works with mouse and touch, unlike HTML5 drag and drop).
 * Put `listRef` on the <ul>, `data-id` on each <li>, and spread `handleProps(id)` on the drag handle.
 */
export function useDragReorder(ids: string[], onReorder: (ids: string[]) => void) {
  const listRef = useRef<HTMLUListElement>(null)
  // Dragged item and live order while dragging; null when idle.
  const [drag, setDrag] = useState<{ id: string; order: string[] } | null>(null)

  const move = (e: PointerEvent<HTMLElement>) => {
    if (!drag || !listRef.current) return
    const others = [...listRef.current.children].filter((el) => (el as HTMLElement).dataset.id !== drag.id)
    const index = others.filter((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top + rect.height / 2 < e.clientY
    }).length
    const next = moveTo(drag.order, drag.id, index)
    if (next.join() !== drag.order.join()) setDrag({ ...drag, order: next })
  }

  const end = () => {
    if (drag && drag.order.join() !== ids.join()) onReorder(drag.order)
    setDrag(null)
  }

  const handleProps = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ id, order: ids })
    },
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
  })

  return { listRef, order: drag?.order ?? ids, draggingId: drag?.id ?? null, handleProps }
}
