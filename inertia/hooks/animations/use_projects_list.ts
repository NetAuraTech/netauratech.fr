import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Autoscroll speed in pixels per second. */
const AUTOSCROLL_SPEED = 30

/** How long a manual scroll keeps the autoscroll paused. */
const AUTOSCROLL_PAUSE_MS = 200

/** Cap for the eased step applied per frame, in pixels. */
const MAX_STEP = 36

/**
 * Bidirectional infinite scroll for the portfolio list, in the 375 vocabulary.
 *
 * On desktop the page is a sealed `100dvh` frame and only this list moves. The
 * track carries three identical copies of the filtered projects (see the
 * page). A single `position` state is kept inside the middle copy — reaching
 * the third copy wraps to the second, crossing below the second wraps forward
 * to it — so the seams are invisible and the stream rolls forever in both
 * directions, with no possible desync or rollback.
 *
 * All input funnels into a `pending` buffer (wheel captured on the whole frame
 * with `preventDefault`, touch drags likewise). Every frame a
 * frame-rate-independant eased slice of it is applied to `position` and written
 * to the list, capped so a fast fling glides instead of jumping; idle motion
 * comes from the slow **autoscroll**, which every input pauses for a moment.
 *
 * The rows themselves sit still — their images are rendered and deformed by
 * `useProjectDistortion`. On smaller screens the list falls back to normal
 * document flow and this hook does nothing. The `filterKey` re-runs it (and
 * resets the scroll) whenever the active category — or the flow mode — changes.
 */
export function useProjectsList<T extends HTMLElement, H extends HTMLElement>(
  ref: RefObject<T | null>,
  hostRef: RefObject<H | null>,
  isDesktop: boolean,
  filterKey: string
) {
  useEffect(() => {
    const scroller = ref.current
    const host = hostRef.current
    if (!scroller || !host || !isDesktop) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    scroller.scrollTop = 0
    const track = scroller.querySelector<HTMLElement>('[data-projects-track]')
    if (!track) return

    const rows = track.querySelectorAll<HTMLElement>('[data-project-row]')
    const copy = rows.length / 3
    const first = rows[0]
    const pivot = rows[copy]
    if (!first || !pivot) return

    const span = pivot.offsetTop - first.offsetTop
    if (!(span > 0)) return

    // Single source of truth for the scroll. `pending` is input yet to be
    // applied; `position` is always kept inside the middle copy.
    let position = 0
    let pending = 0

    let pausedUntil = 0
    const pauseAutoscroll = () => {
      pausedUntil = performance.now() + AUTOSCROLL_PAUSE_MS
    }

    // Wheel over the whole frame, so the projects scroll no matter where the
    // pointer is — the frame itself never scrolls.
    const onWheel = (event: WheelEvent) => {
      // Let the browser keep pinch/ctrl zoom.
      if (event.ctrlKey) return

      event.preventDefault()
      const delta =
        event.deltaMode === 1
          ? event.deltaY * 32
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY

      pending += delta
      pauseAutoscroll()
    }
    host.addEventListener('wheel', onWheel, { passive: false })

    // Touch drags go through the same buffer, so they never fight position.
    let touchY = 0
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0
      pauseAutoscroll()
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return

      event.preventDefault()
      const nextY = event.touches[0].clientY
      pending += touchY - nextY
      touchY = nextY
      pauseAutoscroll()
    }
    host.addEventListener('touchstart', onTouchStart, { passive: true })
    host.addEventListener('touchmove', onTouchMove, { passive: false })

    let raf = 0
    let prev = performance.now()
    const tick = (time: number) => {
      const dt = Math.min(0.05, (time - prev) / 1000)
      prev = time

      // Frame-rate independent easing — the same feel on every refresh rate.
      const ease = 1 - Math.pow(0.001, dt)
      let step = pending * ease
      step = Math.max(-MAX_STEP, Math.min(MAX_STEP, step))
      pending -= step
      if (Math.abs(pending) < 0.5) pending = 0

      position += step

      if (!reduceMotion && performance.now() >= pausedUntil) {
        position += AUTOSCROLL_SPEED * dt
      }

      // Keep position inside the middle copy of the loop.
      while (position >= span * 2) position -= span
      while (position < span) position += span

      scroller.scrollTop = position
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      host.removeEventListener('wheel', onWheel)
      host.removeEventListener('touchstart', onTouchStart)
      host.removeEventListener('touchmove', onTouchMove)
      window.cancelAnimationFrame(raf)
    }
  }, [ref, hostRef, isDesktop, filterKey])
}
