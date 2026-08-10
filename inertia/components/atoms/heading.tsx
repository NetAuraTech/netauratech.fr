import { ReactNode, ElementType } from 'react'

interface HeadingProps {
  /**
   * The heading level. Maps to `<h1>`–`<h4>` and controls the font size:
   * - `1` → `text-4xl`
   * - `2` → `text-3xl`
   * - `3` → `text-2xl`
   * - `4` → `text-xl`
   */
  level: 1 | 2 | 3 | 4
  /**
   * Tailwind text-color class applied to the heading.
   * Defaults to `'text-ink'`.
   */
  color?: string
  flex?: boolean
  children: ReactNode
}

/**
 * Semantic heading component that renders the appropriate `<h1>`–`<h4>` tag.
 *
 * The `level` prop controls both the HTML tag and the font size. Pass a
 * custom `color` class to override the default `text-ink` when the heading
 * is placed on a colored background (e.g. `text-ink-inverted`).
 *
 * @example
 * <Heading level={1}>Page title</Heading>
 * <Heading level={3} color="text-ink-muted">Section subtitle</Heading>
 */
export function Heading(props: HeadingProps) {
  const { level, color = 'text-primary-deep', flex, children } = props

  // Fallback to h2 if level is somehow undefined
  const safeLevel = level ?? 2
  const Tag = `h${safeLevel}` as ElementType

  const levels = {
    1: 'text-[clamp(2.2rem,5vw,4.2rem)]',
    2: 'text-[clamp(1.8rem,4vw,2.4rem)]',
    3: 'text-[clamp(1.6rem,3vw,1.9rem)]',
    4: 'text-base',
  }

  return (
    <Tag
      className={`${levels[safeLevel]} font-playfair leading-tight ${color}${flex ? ' flex gap-2 items-center' : ''}`}
    >
      {children}
    </Tag>
  )
}
