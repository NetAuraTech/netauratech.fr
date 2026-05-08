import { ReactNode } from 'react'
import { urlFor } from '~/client'
import type { LinkProps, LinkParams } from '@adonisjs/inertia/react'
import { Link } from '@adonisjs/inertia/react'

interface ButtonBaseProps {
  /** Shows a spinning loader and disables the button while `true`. */
  loading?: boolean
  /** HTML button type. Defaults to `'submit'`. */
  type?: 'button' | 'submit' | 'reset'
  /**
   * Visual variant.
   *
   * - `primary` — filled primary color, default CTA.
   * - `secondary` — filled secondary color, secondary CTA.
   * - `danger` — filled danger color, destructive actions.
   * - `success` — filled success color, confirmations.
   * - `outline` — transparent with a primary border.
   * - `social` — surface background with a subtle border, for OAuth buttons.
   * - `icon` — no background, hover text only, square padding.
   * - `icon_danger` / `icon_warning` / `icon_info` — soft-background icon buttons.
   *
   * Defaults to `'primary'`.
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'success'
    | 'outline'
    | 'social'
    | 'icon'
    | 'icon_success'
    | 'icon_danger'
    | 'icon_warning'
    | 'icon_info'
    | 'link_muted'
    | 'link_secondary'
  /** Disables the button and applies a reduced-opacity cursor-not-allowed style. */
  disabled?: boolean
  children: ReactNode
  /** Tooltip / accessible title attribute. */
  title?: string
  onClick?: () => void
  /**
   * When `true`, the button shrinks to fit its content (`w-fit`).
   * When `false` (default), it stretches to full width (`w-full`).
   */
  fitContent?: boolean
  /**
   * Renders an `<a>` tag instead of an Inertia `<Link>` when `route` is
   * provided. Use for routes that trigger a server redirect (e.g. OAuth).
   */
  external?: boolean
  href?: string | undefined
}

type ButtonRouteProps<R extends NonNullable<LinkProps['route']>> = ButtonBaseProps & {
  route: R
} & (LinkParams<R>['routeParams'] extends undefined | never
    ? { routeParams?: never }
    : { routeParams: LinkParams<R>['routeParams'] })

type ButtonNoRouteProps = ButtonBaseProps & {
  route?: never
  routeParams?: never
}

type ButtonProps<R extends NonNullable<LinkProps['route']>> =
  | ButtonRouteProps<R>
  | ButtonNoRouteProps

export const variants = {
  primary: 'bg-primary text-ink-inverted hover:bg-primary-deep',
  secondary: 'bg-secondary text-ink-inverted hover:bg-secondary-deep',
  danger: 'bg-danger text-ink-inverted hover:opacity-90',
  success: 'bg-success text-ink-inverted hover:opacity-90',
  outline:
    'border-2 border-solid border-primary text-primary hover:bg-primary hover:text-ink-inverted',
  social: 'bg-surface border border-solid border-edge hover:border-edge-strong shadow text-ink',
  icon: 'hover:bg-primary-soft hover:text-ink-inverted p-2',
  icon_success: 'bg-success-soft text-success hover:bg-success hover:text-ink-inverted p-2',
  icon_danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-ink-inverted p-2',
  icon_warning: 'bg-warning-soft text-warning hover:bg-warning hover:text-ink-inverted p-2',
  icon_info: 'bg-info-soft text-info hover:bg-info hover:text-ink-inverted p-2',
  link_muted: 'text-ink-muted hover:text-primary p-0 font-normal',
  link_secondary: 'text-secondary hover:text-secondary-light  p-0',
}

/**
 * Polymorphic button component that renders as a `<button>`, an Inertia
 * `<Link>`, or a plain `<a>` depending on the supplied props.
 *
 * - **No `route`** → `<button>` with the given `type`.
 * - **`route` without `external`** → Inertia `<Link>` for client-side navigation.
 * - **`route` + `external`** → `<a href>` for server-driven redirects (e.g. OAuth flows).
 *
 * All three variants share the same visual variants, loading state, and
 * disabled state so call sites don't need to handle the distinction.
 *
 * @example
 * // Standard submit button
 * <Button type="submit" loading={processing}>Save</Button>
 *
 * // Inertia link styled as a button
 * <Button route="admin.users.render" variant="outline" fitContent>
 *   Back
 * </Button>
 *
 * // External link (full page navigation)
 * <Button route="auth.social.redirect" routeParams={{ provider }} external variant="social">
 *   Continue with Google
 * </Button>
 */
export function Button<R extends NonNullable<LinkProps['route']>>(props: ButtonProps<R>) {
  const {
    loading,
    type = 'submit',
    variant = 'primary',
    disabled = false,
    children,
    title,
    onClick,
    fitContent = false,
    route,
    routeParams,
    external = false,
    ...buttonProps
  } = props

  const state = loading || disabled ? 'disabled' : 'active'
  const size = fitContent ? 'fit' : 'full'

  const states = {
    active: '',
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  }

  const sizes = {
    fit: 'w-fit',
    full: 'w-full',
  }

  const content = (
    <>
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animation:spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </>
  )

  const classNames = ['button', variants[variant], states[state], sizes[size]]
    .filter(Boolean)
    .join(' ')

  if (route || props.href) {
    if (external) {
      return (
        <a
          href={props.href ?? urlFor(route as any, routeParams as any)}
          className={classNames}
          title={title}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        href={props.href ?? urlFor(route as any, routeParams as any)}
        className={classNames}
        onClick={onClick}
        title={title}
        {...buttonProps}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      disabled={loading || disabled}
      type={type}
      onClick={onClick}
      className={`button ${variants[variant]} ${states[state]} ${sizes[size]}`}
      title={title}
      {...buttonProps}
    >
      {content}
    </button>
  )
}
