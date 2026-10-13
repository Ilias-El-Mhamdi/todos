import { useRef } from 'react'
import type { TouchEvent } from 'react'

const MIN_DISTANCE_PX = 60
const MAX_DURATION_MS = 600

/**
 * Element where a horizontal swipe must not change tabs: a field, a drag handle (touch-action: none) or something
 * that scrolls sideways itself (filter chips).
 */
function ownsGesture(target: EventTarget, container: Element): boolean {
  for (let el = target as Element | null; el && el !== container; el = el.parentElement) {
    if (el.matches('input, textarea, select')) return true
    const style = getComputedStyle(el)
    if (style.touchAction === 'none') return true
    if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth) return true
  }
  return false
}

/**
 * Swipe left → next tab, swipe right → previous one (no wrap-around). Spread the result on the tab content.
 * Touch events rather than pointer events: the browser cancels pointers as soon as it starts scrolling.
 */
export function useSwipeTabs<T>(tabs: readonly T[], current: T, onChange: (tab: T) => void) {
  const start = useRef<{ x: number; y: number; time: number } | null>(null)

  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0]
      start.current =
        e.touches.length === 1 && !ownsGesture(e.target, e.currentTarget)
          ? { x: touch.clientX, y: touch.clientY, time: Date.now() }
          : null
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current
      start.current = null
      if (!s || Date.now() - s.time > MAX_DURATION_MS) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - s.x
      const dy = touch.clientY - s.y
      // Clearly horizontal, so a scroll that drifts sideways doesn't count.
      if (Math.abs(dx) < MIN_DISTANCE_PX || Math.abs(dx) < 2 * Math.abs(dy)) return
      const next = tabs[tabs.indexOf(current) + (dx < 0 ? 1 : -1)]
      if (next !== undefined) onChange(next)
    },
    onTouchCancel: () => {
      start.current = null
    },
  }
}
