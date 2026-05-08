import { useEffect, useRef, useState } from 'react'
import type { Theme } from '#types/preferences'
import { toast } from 'sonner'
import { useAuth } from '~/hooks/use_auth'
import { type SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'

/**
 * Applies or removes the `dark` class on `<html>` and syncs `localStorage`.
 */
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

/**
 * Switches to the given theme with a circular View Transition expanding from
 * the center of `element`. Falls back to an instant switch when the View
 * Transition API is unavailable or when the user prefers reduced motion.
 *
 * @param theme - The theme to apply.
 * @param element - The element used as the origin of the circle animation.
 */
async function switchTheme(theme: Theme, element: HTMLElement): Promise<void> {
  if (
    !document.startViewTransition ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    applyTheme(theme)
    return
  }

  const { top, left, width, height } = element.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const right = window.innerWidth - x
  const bottom = window.innerHeight - y
  const radius = Math.hypot(Math.max(x, right), Math.max(y, bottom))

  const transition = document.startViewTransition(() => {
    applyTheme(theme)
  })

  await transition.ready

  document.documentElement.animate(
    {
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
    },
    {
      duration: 500,
      easing: 'ease-in-out',
      pseudoElement: '::view-transition-new(root)',
    }
  )
}

/**
 * Resolves the initial theme with the following priority:
 * 1. Server-side preference (authenticated users)
 * 2. `localStorage` (returning guests)
 * 3. OS `prefers-color-scheme` (first visit)
 */
function resolveInitialTheme(serverTheme: Theme | undefined, isAuthenticated: boolean): Theme {
  if (isAuthenticated && serverTheme) {
    return serverTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface UseThemeOptions {
  /**
   * - `'standalone'` *(default)* — applies the theme, syncs localStorage, and
   *   sends a `PATCH /settings/preferences` request when authenticated.
   * - `'field'` — applies the theme and syncs localStorage only. No server
   *   request is sent — the parent form is responsible for persistence.
   */
  mode?: 'standalone' | 'field'

  /**
   * Controlled value for `'field'` mode. When provided, the internal state
   * is driven by this value instead of the resolved initial theme.
   */
  value?: Theme

  /**
   * Callback fired after the theme is toggled in `'field'` mode, giving the
   * parent form access to the new value.
   */
  onChange?: (theme: Theme) => void
}

/**
 * Hook managing the active color scheme and its persistence.
 *
 * Supports two modes via {@link UseThemeOptions.mode}:
 * - **`'standalone'`** *(default)* — self-contained, handles server persistence.
 * - **`'field'`** — visual + localStorage only, designed for use inside a form
 *   where the parent is responsible for the `PATCH` request.
 *
 * Initial theme resolution priority (standalone):
 * 1. Server-side preference from Inertia shared props (authenticated users)
 * 2. `localStorage` (returning guests)
 * 3. OS `prefers-color-scheme` (first visit, no stored preference)
 *
 * @returns The current {@link Theme}, a `setTheme` callback, a `toggleTheme`
 *   shorthand, and a `ref` to attach to the toggle button for animation positioning.
 *
 * @example
 * // Standalone
 * const { theme, toggleTheme, ref } = useTheme()
 *
 * // Inside a preferences form
 * const { theme, toggleTheme, ref } = useTheme({ mode: 'field', value, onChange })
 */
export function useTheme(options: UseThemeOptions = {}) {
  const { mode = 'standalone', value, onChange } = options
  const { isAuthenticated } = useAuth()
  const pageProps = usePage<SharedProps>().props
  const serverTheme = pageProps.preferences?.theme
  const ref = useRef<HTMLButtonElement>(null)

  const [theme, setThemeState] = useState<Theme>(() => {
    if (mode === 'field' && value) return value
    return resolveInitialTheme(serverTheme, isAuthenticated)
  })

  /**
   * Keep field mode in sync with the controlled value from the parent form.
   */
  useEffect(() => {
    if (mode === 'field' && value && value !== theme) {
      setThemeState(value)
      applyTheme(value)
    }
  }, [value, mode])

  /**
   * Sync with server preference when the user logs in or preferences change.
   */
  useEffect(() => {
    if (mode === 'standalone' && isAuthenticated && serverTheme && serverTheme !== theme) {
      setThemeState(serverTheme)
      applyTheme(serverTheme)
    }
  }, [serverTheme, isAuthenticated, mode])

  const setTheme = async (next: Theme) => {
    if (mode === 'field') {
      onChange?.(next)
      return
    }

    if (isAuthenticated) {
      const response = await fetch('/api/settings/preferences/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': pageProps.csrfToken,
        },
        body: JSON.stringify({
          theme: next,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error.message)

        return
      }

      toast.success(response.text())
    }

    setThemeState(next)

    const element = ref.current
    if (element) {
      await switchTheme(next, element)
    } else {
      applyTheme(next)
    }
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggleTheme, ref }
}
