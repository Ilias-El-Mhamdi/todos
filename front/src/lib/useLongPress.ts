import { useRef } from 'react'
import type { PointerEvent } from 'react'

const DELAY_MS = 500
/** Moving more than this cancels the press (the user is scrolling). */
const MOVE_TOLERANCE_PX = 10

/**
 * Tap → `onTap`, press and hold → `onLongPress` (right click too, on desktop). Spread the result on the element.
 * The click that follows a long press is swallowed so it doesn't also count as a tap.
 */
export function useLongPress(onLongPress: () => void, onTap: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const cancel = () => {
    clearTimeout(timer.current)
    start.current = null
  }

  const fire = () => {
    cancel()
    if (fired.current) return
    fired.current = true
    navigator.vibrate?.(15)
    onLongPress()
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0) return
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = setTimeout(fire, DELAY_MS)
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start.current) return
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE_PX) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // Right click on desktop; Android also sends it on a long press, possibly before our timer.
    onContextMenu: (e: { preventDefault: () => void }) => {
      e.preventDefault()
      fire()
    },
    onClick: () => {
      if (fired.current) fired.current = false
      else onTap()
    },
  }
}
