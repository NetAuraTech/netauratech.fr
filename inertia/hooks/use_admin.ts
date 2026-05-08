import { useCallback, useMemo } from 'react'
import { type LinkProps } from '@adonisjs/inertia/react'
import { useTranslation } from '~/hooks/use_translation'
import { usePage } from '@inertiajs/react'
import { type SharedProps } from '@adonisjs/inertia/types'

interface MenuEntryBase {
  label: string
  icon?: string
  permission: string | string[]
}

type MenuEntry<R extends NonNullable<LinkProps['route']>> = MenuEntryBase & {
  route: R
  routeParams?: any
}

type AnyMenuEntry = {
  [R in NonNullable<LinkProps['route']>]: MenuEntry<R>
}[NonNullable<LinkProps['route']>]

interface Menu {
  [key: string]: AnyMenuEntry[]
}

/**
 * Returns the application menu and related utilities, optionally extended or overridden.
 *
 * Categories from `overrides` are deep-merged with the default menu:
 * - Existing categories have their entries appended by the override entries
 * - New categories are appended
 *
 * @param overrides - Partial menu to merge into the default menu
 * @returns An object containing:
 * - `menu` — the merged menu object
 * - `getEntryIcon` — a function to retrieve the icon of a menu entry by its route
 *
 * @example
 * // Default menu only
 * const { menu } = useMenu()
 *
 * @example
 * // Override an existing category and add a new one
 * const { menu } = useMenu({
 *   main: [{ label: 'home', icon: '', route: 'home.render' }],
 *   settings: [{ label: 'profile', icon: '', route: 'settings.profile.render' }],
 * })
 *
 * @example
 * // Retrieve the icon of a menu entry by its route
 * const { getEntryIcon } = useMenu()
 * const icon = getEntryIcon('admin.dashboard.render')
 */
export function useMenu(overrides: Menu = {}) {
  const pageProps = usePage<SharedProps>().props
  const { t } = useTranslation(pageProps.cms_translations!)

  const defaultMenu: Menu = {
    no_category: [
      {
        label: t('dashboard'),
        icon: 'House',
        route: 'admin.dashboard.render',
        permission: 'admin.access',
      },
    ],
    content: [
      {
        label: t('pages'),
        icon: 'PanelsTopLeft',
        route: 'admin.pages.render',
        permission: 'pages.view',
      },
      {
        label: t('templates'),
        icon: 'LayoutTemplate',
        route: 'admin.templates.render',
        permission: 'templates.manage',
      },
      {
        label: t('files'),
        icon: 'Folder',
        route: 'admin.files.render',
        permission: 'files.view',
      },
    ],
    access_control: [
      {
        label: t('users'),
        icon: 'Users',
        route: 'admin.users.render',
        permission: 'users.view',
      },
    ],
  }

  const menu = useMemo(() => {
    const merged: Menu = { ...defaultMenu }

    Object.entries(overrides).forEach(([category, entries]) => {
      merged[category] = [...(merged[category] ?? []), ...entries]
    })

    return merged
  }, [overrides])

  /**
   * Retrieves the icon of a menu entry by its route.
   *
   * Searches across all categories of the merged menu and returns the icon
   * of the first matching entry, or `undefined` if no entry is found.
   *
   * @param route - The route identifier of the menu entry
   * @returns The icon string if found, otherwise `undefined`
   *
   * @example
   * const icon = getEntryIcon('admin.dashboard.render')
   */
  const getEntryIcon = useCallback(
    (route: NonNullable<LinkProps['route']>): string | undefined => {
      return Object.values(menu)
        .flat()
        .find((entry) => entry.route === route)?.icon
    },
    [menu]
  )

  return { menu, getEntryIcon }
}

export type { MenuEntry, AnyMenuEntry, Menu }
