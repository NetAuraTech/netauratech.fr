import type { ResolvedBlock } from '#types/page'
import { Icon } from '~/components/atoms/icon'

const backgroundMap: Record<string, string> = {
  'none': '',
  'canvas': 'bg-canvas',
  'surface': 'bg-surface',
  'sunken': 'bg-sunken',
  'primary-deep': 'bg-primary-deep',
  'primary': 'bg-primary',
  'primary-soft': 'bg-primary-soft',
  'primary-light': 'bg-primary-light',
  'secondary-deep': 'bg-secondary-deep',
  'secondary': 'bg-secondary',
  'secondary-soft': 'bg-secondary-soft',
  'secondary-light': 'bg-secondary-light',
  'tertiary-deep': 'bg-tertiary-deep',
  'tertiary': 'bg-tertiary',
  'tertiary-soft': 'bg-tertiary-soft',
  'tertiary-light': 'bg-tertiary-light',
  'transparent': 'bg-transparent',
}

const colorMap: Record<string, string> = {
  'default': 'text-ink',
  'ink-inverted': 'text-ink-inverted',
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
}

interface IconBlockProps {
  block: ResolvedBlock<'icon'>
}

/**
 * Renders an Icon with configurable name.
 * Reuses the semantic HTML svg element so the page outline stays correct.
 */
export default function IconBlock({ block }: IconBlockProps) {
  const { name, size, color, background, className } = block.props

  return (
    <div
      className={[colorMap[color], backgroundMap[background], className].filter(Boolean).join(' ')}
    >
      {name && <Icon name={name} size={size} />}
    </div>
  )
}
