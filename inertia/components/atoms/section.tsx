import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  /** Optional `id` attribute for anchor linking. */
  id?: string
  /**
   * Tailwind classes applied to the `<section>` element.
   * Defaults to `'py-8'`.
   */
  className?: string
}

/**
 * Semantic page section wrapper.
 *
 * Thin abstraction over `<section>` that enforces the use of a semantic HTML
 * landmark while allowing layout classes to be injected via `className`.
 * The default padding (`py-8`) can be overridden by passing a different value.
 *
 * @example
 * // Default vertical padding
 * <Section>
 *   <p>Content</p>
 * </Section>
 *
 * // Custom layout classes
 * <Section className="py-8 grid gap-4">
 *   <Card>...</Card>
 * </Section>
 *
 * // Anchor target
 * <Section id="features" className="py-16">
 *   ...
 * </Section>
 */
export function Section(props: SectionProps) {
  const { children, className = 'py-8', ...sectionProps } = props

  return (
    <section {...sectionProps} className={className}>
      {children}
    </section>
  )
}
