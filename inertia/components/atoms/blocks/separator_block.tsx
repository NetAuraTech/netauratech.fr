import type { ResolvedBlock } from '#types/page'

const spacingMap: Record<string, string> = {
  none: '',
  sm: 'my-4',
  md: 'my-8',
  lg: 'my-12',
  xl: 'my-16',
}

const colorMap: Record<string, string> = {
  'none': '',
  'canvas': 'text-canvas',
  'surface': 'text-surface',
  'sunken': 'text-sunken',
  'primary-deep': 'text-primary-deep',
  'primary': 'text-primary',
  'primary-soft': 'text-primary-soft',
  'primary-light': 'text-primary-light',
  'secondary-deep': 'text-secondary-deep',
  'secondary': 'text-secondary',
  'secondary-soft': 'text-secondary-soft',
  'secondary-light': 'text-secondary-light',
  'tertiary-deep': 'text-tertiary-deep',
  'tertiary': 'text-tertiary',
  'tertiary-soft': 'text-tertiary-soft',
  'tertiary-light': 'text-tertiary-light',
  'transparent': 'text-transparent',
}

interface SeparatorBlockProps {
  block: ResolvedBlock<'separator'>
}

/**
 * A simple horizontal rule with configurable style, spacing, and colour.
 */
export default function SeparatorBlock({ block }: SeparatorBlockProps) {
  const { spacing, color, className = 'w-full' } = block.props

  const spacingClass = spacingMap[spacing ?? 'none'] ?? ''
  const colorClass = colorMap[color ?? 'none']

  return (
    <hr
      className={['h-px', spacingClass, colorClass, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
