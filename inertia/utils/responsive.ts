import type { ResponsiveValue } from '#types/page'

/**
 * Resolves a `ResponsiveValue<T>` into a Tailwind class string by looking up
 * each breakpoint in the provided map.
 *
 * The map must cover every possible value of `T` at every breakpoint key.
 * Breakpoints present in `value` but absent from the map are silently skipped.
 *
 * @example
 * const paddingMap = {
 *   none: { default: 'py-0', md: 'md:py-0', lg: 'lg:py-0' },
 *   sm:   { default: 'py-4', md: 'md:py-4', lg: 'lg:py-4' },
 *   md:   { default: 'py-8', md: 'md:py-8', lg: 'lg:py-8' },
 * }
 * resolveResponsive({ default: 'sm', md: 'md' }, paddingMap)
 * // → 'py-4 md:py-8'
 */
export function resolveResponsive<T extends string | number>(
  value: ResponsiveValue<T>,
  map: Record<string | number, Partial<Record<'default' | 'sm' | 'md' | 'lg' | 'xl', string>>>
): string {
  const classes: string[] = []

  const breakpoints = ['default', 'sm', 'md', 'lg', 'xl'] as const

  for (const bp of breakpoints) {
    const val = (value as any)[bp]
    if (val === undefined) continue
    const cls = map[val]?.[bp]
    if (cls) classes.push(cls)
  }

  return classes.filter(Boolean).join(' ')
}
