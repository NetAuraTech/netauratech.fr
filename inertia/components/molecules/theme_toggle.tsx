import { useTheme, UseThemeOptions } from '~/hooks/use_theme'
import type { Theme } from '#types/preferences'
import { Icon } from '~/components/atoms/icon'

interface ThemeToggleProps {
  /**
   * - `'standalone'` *(default)* — self-contained toggle that handles server
   *   persistence on its own.
   * - `'field'` — controlled toggle for use inside a form. Applies the theme
   *   visually but delegates persistence to the parent form via `onChange`.
   */
  mode?: UseThemeOptions['mode']

  /**
   * Controlled default value in `'field'` mode. Should be the current form field value.
   */
  defaultValue?: Theme

  /**
   * Callback fired when the user toggles the theme in `'field'` mode.
   * Use this to update the parent form state.
   */
  onChange?: (theme: Theme) => void
}

/**
 * Pill-shaped toggle that switches between `light` and `dark` themes.
 *
 * Supports two modes:
 * - **`'standalone'`** *(default)* — self-contained, sends a
 *   `POST /settings/preferences` request when the user is authenticated.
 * - **`'field'`** — controlled input for use inside a preferences form.
 *   Applies the theme visually but leaves persistence to the parent form.
 *
 * In both modes, the View Transition API is used for the circle animation
 * with a graceful fallback for unsupported browsers or reduced motion.
 *
 * @example
 * // Standalone (e.g. in navbar)
 * <ThemeToggle />
 *
 * // Inside a preferences form
 * <ThemeToggle mode="field" value={formData.theme} onChange={(t) => setField('theme', t)} />
 */
export function ThemeToggle(props: ThemeToggleProps) {
  const { mode = 'standalone', defaultValue, onChange } = props

  const { theme, toggleTheme, ref } = useTheme({ mode, value: defaultValue, onChange })

  const isDark = theme === 'dark'

  const dotStyles: Record<Theme, string> = {
    light: 'translate-x-0 bg-raised text-warning',
    dark: 'translate-x-7 bg-raised text-info',
  }

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`
      relative flex items-center
      w-14 h-7 px-0.5
      cursor-pointer
      rounded-full border-2
      transition-colors duration-300 ease-in-out
      focus-visible:outline-none focus-visible:border-primary
      bg-sunken border-edge
    `}
    >
      <span
        className={`
        flex items-center justify-center
        w-5 h-5 rounded-full
        shadow-sm
        transition-transform duration-300 ease-in-out
        border border-edge
        ${dotStyles[theme]}
      `}
      >
        {isDark ? <Icon name="Moon" size={12} /> : <Icon name="Sun" size={12} />}
      </span>
    </button>
  )
}
