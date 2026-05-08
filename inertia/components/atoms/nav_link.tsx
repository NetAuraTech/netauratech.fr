import { router, usePage } from '@inertiajs/react'
import { ReactNode, MouseEvent, useState, useEffect } from 'react'
import type { FontSize } from '#types/font'
import { getFontSizeClass } from '~/utils/font'
import { Link } from '@adonisjs/inertia/react'
import type { LinkProps, LinkParams } from '@adonisjs/inertia/react'
import { urlFor } from '~/client'

type NavLinkBaseProps = {
  /** Visible link text. */
  label: string
  /** Tooltip / accessible title attribute. */
  title?: string
  /** Optional leading content (e.g. an `<Icon>`). Rendered before `label`. */
  children?: ReactNode
  onClick?: (e: MouseEvent) => void
  /** Font size token. Defaults to `'base'`. */
  fs?: FontSize
  /**
   * Visual variant.
   *
   * - `'link'` — secondary underline-style link, default.
   * - `'nav'` — neutral text that turns secondary on hover and when active.
   * - `'setting_nav'` — tab-style link with a bottom border indicator.
   * - `'pagination'` — button-shaped link used inside `<Pagination>`.
   * - `'admin_nav'` — button-shaped link used inside Administration.
   */
  variant?: 'link' | 'nav' | 'setting_nav' | 'pagination' | 'admin_nav' | 'external' | 'footer'
  fitContent?: boolean
  /** Disables pointer events and applies a reduced-opacity style. */
  disabled?: boolean
  /** Bypass isActive logic */
  isActive?: boolean
}

type NavLinkRouteProps<R extends NonNullable<LinkProps['route']>> = NavLinkBaseProps & {
  route: R
  /** Optional URL fragment appended to the resolved href (e.g. `'section-1'`). */
  anchor?: string
  /**
   * Query-string parameters merged into the URL. When provided the link uses
   * a plain `href` instead of an Inertia route so the query string is
   * preserved correctly
   */
  qs?: Record<string, any> | undefined
} & (LinkParams<R>['routeParams'] extends undefined | never
    ? { routeParams?: never }
    : { routeParams: LinkParams<R>['routeParams'] })

type NavLinkNoRouteProps = NavLinkBaseProps & {
  route?: never
  routeParams?: never
  /** Optional URL fragment appended to the resolved href (e.g. `'section-1'`). */
  anchor?: string
  /**
   * Query-string parameters merged into the URL. When provided the link uses
   * a plain `href` instead of an Inertia route so the query string is
   * preserved correctly
   */
  qs?: Record<string, any> | undefined
}

type NavLinkProps<R extends NonNullable<LinkProps['route']>> =
  | NavLinkRouteProps<R>
  | NavLinkNoRouteProps

export const variants = {
  link: 'text-secondary hover:text-secondary-deep',
  nav: 'uppercase text-xs text-ink current:text-secondary hover:text-secondary',
  setting_nav:
    'px-4 py-2.5 border-b-2 -mb-px border-transparent current:border-secondary hover:border-secondary text-ink-muted current:text-secondary hover:text-secondary cursor-pointer',
  pagination:
    'button font-normal hover:bg-primary hover:text-ink-inverted current:bg-primary current:text-ink-inverted px-2 py-1',
  admin_nav:
    'flex items-center gap-2 p-3 rounded hover:text-ink-inverted hover:bg-primary-deep current:text-ink-inverted current:bg-primary-deep',
  external:
    'text-secondary hover:text-secondary-light font-semibold font-cormorant tracking-wide italic text-lg',
  footer: 'text-ink-inverted hover:text-primary-light text-sm flex items-center',
}

/**
 * Navigation link component with active-state detection.
 *
 * Compares the current Inertia URL against the resolved href to determine
 * whether the link is active, then sets `aria-current="page"` and applies
 * the `current:` variant styles accordingly.
 *
 * Active matching is two-part:
 * 1. **Path** — the current path equals the resolved href or starts with it
 *    followed by `/`.
 * 2. **Query string** — when `qs` is provided, every key/value pair in `qs`
 *    must match the current URL params (with a special case for `page=1`
 *    matching an absent `page` param).
 *
 * When `anchor` or `qs` are provided, a plain `href` string is built instead
 * of using an Inertia route object, so the full URL including fragment and
 * query string is preserved.
 *
 * @example
 * // Simple nav link
 * <NavLink route="page.home" label="Home" variant="nav" />
 *
 * // Settings tab
 * <NavLink route="settings.profile.render" label="Profile" variant="setting_nav" />
 *
 * // Pagination link with query string
 * <NavLink route="admin.users.render" label="2" variant="pagination" qs={{ page: 2 }} />
 */
export function NavLink<R extends NonNullable<LinkProps['route']>>(props: NavLinkProps<R>) {
  const { label, title, children, onClick, fs = 'base', variant = 'link', disabled } = props
  const { url } = usePage()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const determineActive = () => {
      const currentPath = window.location.pathname

      const resolvedHref = props.route ? (urlFor as any)(props.route, props.routeParams) : ''

      const pathMatches = currentPath === resolvedHref

      const currentHash = window.location.hash.replace('#', '')
      const targetAnchor = props.anchor ?? ''
      const anchorMatches = targetAnchor === currentHash

      setIsActive((pathMatches && anchorMatches) || (props.isActive ?? false))
    }

    determineActive()

    const removeFinishEventListener = router.on('finish', () => {
      determineActive()
    })

    return () => {
      removeFinishEventListener()
    }
  }, [url, props.anchor, props.route, props.routeParams])

  const states = {
    active: '',
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  }

  const fontSizeClass = getFontSizeClass(fs)

  const state = disabled ? 'disabled' : 'active'

  let linkProps: any = { href: '#' }

  if (props.route) {
    linkProps =
      props.anchor || props.qs
        ? {
            href: `${urlFor(props.route as any, props.routeParams as any, { qs: props.qs })}${props.anchor ? `#${props.anchor}` : ''}`,
          }
        : ({
            route: props.route,
            routeParams: props.routeParams,
          } as unknown as LinkProps<R>)
  }

  return (
    <Link
      {...linkProps}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={`${fontSizeClass} ${variants[variant]} ${states[state]}`}
      title={title}
    >
      {children}
      {label}
    </Link>
  )
}
