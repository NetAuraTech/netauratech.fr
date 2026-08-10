import { ReactNode } from 'react'

interface BadgeProps {
  /** Visual variant of the badge. */
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  /** Badge content. */
  children: ReactNode
  /** Additional Tailwind classes. */
  className?: string
  /** Native `title` attribute shown as a tooltip on hover. */
  title?: string
  /** Optional click handler. */
  onClick?: () => void
}

const variants = {
  default: 'bg-ink-soft text-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  outline: 'border border-solid border-edge text-ink-muted',
}

/**
 * Small status indicator component.
 *
 * @example
 * // Default badge
 * <Badge variant="default">Default</Badge>
 *
 * // Status badges
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="danger">Error</Badge>
 * <Badge variant="info">Info</Badge>
 *
 * // Outline style
 * <Badge variant="outline">Outline</Badge>
 */
export function Badge(props: BadgeProps) {
  const { variant = 'default', children, className = '', title, onClick } = props

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
