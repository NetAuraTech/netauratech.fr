import { useEffect, useState } from 'react'

/**
 * Tracks whether the viewport meets or exceeds the `lg` breakpoint.
 *
 * Reads the `--breakpoint-lg` CSS custom property from the document root
 * to stay in sync with the Tailwind breakpoint definition.
 * Falls back to `1024px` if the property is not defined or during SSR.
 *
 * Automatically updates on viewport resize via a `MediaQueryList` listener.
 *
 * @returns `true` if the viewport width is at least `lg`, `false` otherwise.
 * Returns `false` on initial render until the effect runs (SSR-safe).
 *
 * @example
 * const isLarge = useIsLarge()
 *
 * return isLarge ? <DesktopNav /> : <MobileNav />
 */
export function useIsLarge() {
  const getLgValue = () => {
    if (typeof window === 'undefined') return '1024px'
    return (
      getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-lg') || '1024px'
    )
  }

  const [isLarge, setIsLarge] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${getLgValue()})`)

    setIsLarge(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsLarge(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isLarge
}
