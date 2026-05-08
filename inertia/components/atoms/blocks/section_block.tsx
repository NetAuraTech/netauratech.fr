import { resolveResponsive } from '~/utils/responsive'
import type { ResolvedBlock } from '#types/page'
import { Section } from '~/components/atoms/section'
import { ReactNode } from 'react'

const paddingYMap = {
  none: { default: 'py-0', md: 'md:py-0', lg: 'lg:py-0' },
  sm: { default: 'py-8', md: 'md:py-10', lg: 'lg:py-12' },
  md: { default: 'py-20', md: 'md:py-28', lg: 'lg:py-32' },
  lg: { default: 'py-28', md: 'md:py-36', lg: 'lg:py-44' },
  xl: { default: 'py-36', md: 'md:py-48', lg: 'lg:py-60' },
}

const paddingXMap = {
  none: { default: 'px-0', md: 'md:px-0', lg: 'lg:px-0' },
  sm: { default: 'px-4', md: 'md:px-8', lg: 'lg:px-12' },
  md: { default: 'px-6', md: 'md:px-16', lg: 'lg:px-24' },
  lg: { default: 'px-8', md: 'md:px-24', lg: 'lg:px-32' },
  xl: { default: 'px-12', md: 'md:px-32', lg: 'lg:px-48' },
}

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

interface SectionBlockProps {
  block: ResolvedBlock<'section'>
  children?: ReactNode
}

/**
 * Wrapper block that defines the section's background, spacing, and max-width.
 * All visual child blocks are rendered inside this container.
 */
export default function SectionBlock(props: SectionBlockProps) {
  const { block, children } = props
  const { background, paddingY, paddingX, id, className } = block.props

  const pyClasses = resolveResponsive(paddingY, paddingYMap)
  const pxClasses = resolveResponsive(paddingX, paddingXMap)
  const bgClass = backgroundMap[background] ?? ''

  return (
    <Section
      id={id}
      className={[bgClass, pyClasses, pxClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Section>
  )
}
