import { ReactNode } from 'react'
import type { FontSize } from '#types/font'
import { getFontSizeClass } from '~/utils/font'
import type { ParagraphSpacing, ParagraphVariants } from '#types/paragraph'

interface ParagraphProps {
  children: ReactNode
  /** Font size token. Defaults to `'base'`. */
  fs?: FontSize
  /**
   * Text color variant.
   *
   * - `'foreground'` — primary text color (`text-ink`), default.
   * - `'muted'` — secondary text color (`text-ink-muted`).
   * - `'subtle'` — tertiary text color (`text-ink-subtle`).
   * - `'error'` — danger text color (`text-danger`).
   * - `'custom'` — applies the class string passed in `color`.
   */
  variant?: ParagraphVariants
  /**
   * Top margin applied when the paragraph is not the first child of its
   * container.
   *
   * - `'xs'` — no margin.
   * - `'sm'` — `mt-2`.
   * - `'base'` — `mt-4`, default.
   * - `'xl'` — `mt-6`.
   */
  spacing?: ParagraphSpacing
  className?: string
}

/**
 * Styled paragraph component.
 *
 * Wraps text content in a `<p>` tag with consistent line height, balanced
 * text wrapping, and optional spacing between sibling paragraphs. Use the
 * `variant` prop for semantic color roles and `spacing` to control vertical
 * rhythm within a content block.
 *
 * @example
 * <Paragraph>Standard body text.</Paragraph>
 * <Paragraph variant="muted" spacing="sm">Secondary description.</Paragraph>
 * <Paragraph variant="error">Validation failed.</Paragraph>
 * <Paragraph variant="custom" color="text-secondary font-medium">Custom style.</Paragraph>
 */
export function Paragraph(props: ParagraphProps) {
  const {
    children,
    variant = 'ink',
    fs = 'base',
    spacing = 'base',
    className = 'text-balance leading-7',
  } = props

  const fontSizeClass = getFontSizeClass(fs)

  const variants = {
    'ink': 'text-ink',
    'ink-inverted': 'text-ink-inverted',
    'muted': 'text-ink-muted',
    'subtle': 'text-ink-subtle',
    'error': 'text-danger',
    'primary-light': 'text-primary-light',
    'primary-soft': 'text-primary-soft',
    'primary': 'text-primary',
    'primary-deep': 'text-primary-deep',
    'secondary-light': 'text-secondary-light',
    'secondary-soft': 'text-secondary-soft',
    'secondary': 'text-secondary',
    'secondary-deep': 'text-secondary-deep',
    'tertiary-light': 'text-tertiary-light',
    'tertiary-soft': 'text-tertiary-soft',
    'tertiary': 'text-tertiary',
    'tertiary-deep': 'text-tertiary-deep',
  }

  const spacings = {
    xs: '',
    sm: '[&:not(:first-child)]:mt-2',
    base: '[&:not(:first-child)]:mt-4',
    xl: '[&:not(:first-child)]:mt-6',
  }

  return (
    <p
      className={[variants[variant], fontSizeClass, spacings[spacing], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </p>
  )
}
