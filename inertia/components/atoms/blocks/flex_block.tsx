import { resolveResponsive } from '~/utils/responsive'
import type { ResolvedBlock } from '#types/page'
import { ReactNode } from 'react'

const directionMap = {
  'row': { default: 'flex-row', md: 'md:flex-row', lg: 'lg:flex-row' },
  'col': { default: 'flex-col', md: 'md:flex-col', lg: 'lg:flex-col' },
  'row-reverse': {
    default: 'flex-row-reverse',
    md: 'md:flex-row-reverse',
    lg: 'lg:flex-row-reverse',
  },
  'col-reverse': {
    default: 'flex-col-reverse',
    md: 'md:flex-col-reverse',
    lg: 'lg:flex-col-reverse',
  },
}

const gapMap = {
  none: { default: 'gap-0', md: 'md:gap-0', lg: 'lg:gap-0' },
  xs: { default: 'gap-1', md: 'md:gap-1.5', lg: 'lg:gap-2' },
  sm: { default: 'gap-4', md: 'md:gap-6', lg: 'lg:gap-8' },
  md: { default: 'gap-8', md: 'md:gap-12', lg: 'lg:gap-16' },
  lg: { default: 'gap-12', md: 'md:gap-16', lg: 'lg:gap-24' },
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
}

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
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

interface FlexBlockProps {
  block: ResolvedBlock<'flex'>
  children: ReactNode
}

export default function FlexBlock(props: FlexBlockProps) {
  const { block, children } = props

  const {
    as: Component = 'div',
    direction,
    gap,
    align = 'start',
    justify = 'start',
    wrap = false,
    background,
    className,
  } = block.props

  const dirClasses = resolveResponsive(direction || { default: 'col' }, directionMap)
  const gapClasses = resolveResponsive(gap || { default: 'none' }, gapMap)

  return (
    <Component
      className={[
        'flex',
        backgroundMap[background],
        dirClasses,
        gapClasses,
        alignMap[align],
        justifyMap[justify],
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Component>
  )
}
