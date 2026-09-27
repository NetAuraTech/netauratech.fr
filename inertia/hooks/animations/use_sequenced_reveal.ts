import { useEffect } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'

interface UseSequencedRevealSelectors {
  /** Selector of the kicker element, faded in first. */
  kicker: string
  /** Selector of the lede element, blurred in second. */
  lede: string
  /**
   * Selectors of the trailing elements answered after the lede — the CTA
   * cluster, figure bands, meta strips. Each is faded in sequence.
   */
  tails?: string[]
  /** Delay between the first and last trailing element, in seconds. Defaults to `0`. */
  tailStagger?: number
}

/**
 * Sequential entrance reveal shared by the front's opening sections, in the
 * 375 vocabulary. The kicker fades in, the lede fades in with a blur, and the
 * trailing elements (actions, gallery, meta) follow in order — the headline
 * rises independently via `useTextRise`. It is a no-op under
 * `prefers-reduced-motion`.
 *
 * @example
 * const heroRef = useRef<HTMLElement>(null)
 * useSequencedReveal(heroRef, { kicker: '.hero__kicker', lede: '.hero-lede', tails: ['.hero__actions'] })
 */
export function useSequencedReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  selectors: UseSequencedRevealSelectors
) {
  const {
    kicker: kickerSelector,
    lede: ledeSelector,
    tails: tailsSelectors = [],
    tailStagger = 0,
  } = selectors

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const kicker = root.querySelector(kickerSelector)
    const lede = root.querySelector(ledeSelector)
    const tails = tailsSelectors
      .map((selector) => root.querySelector(selector))
      .filter((element): element is Element => element !== null)

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (kicker) {
        timeline.fromTo(kicker, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.3)
      }

      if (lede) {
        timeline.fromTo(
          lede,
          { autoAlpha: 0, y: 24, filter: 'blur(6px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6 },
          1.8
        )
      }

      const tailOffset = tailStagger / Math.max(tails.length, 1)
      tails.forEach((element, i) => {
        timeline.fromTo(
          element,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.55 },
          2.05 + i * tailOffset
        )
      })
    }, root)

    return () => ctx.revert()
  }, [ref, kickerSelector, ledeSelector, tailsSelectors.join(','), tailStagger])
}
