import { resolveResponsive } from '~/utils/responsive'
import type { ResolvedBlock } from '#types/page'
import { ReactNode } from 'react'

const colsMap: Record<number, Partial<Record<'default' | 'md' | 'lg', string>>> = {
  1: { default: 'grid-cols-1', md: 'md:grid-cols-1', lg: 'lg:grid-cols-1' },
  2: { default: 'grid-cols-2', md: 'md:grid-cols-2', lg: 'lg:grid-cols-2' },
  3: { default: 'grid-cols-3', md: 'md:grid-cols-3', lg: 'lg:grid-cols-3' },
  4: { default: 'grid-cols-4', md: 'md:grid-cols-4', lg: 'lg:grid-cols-4' },
  6: { default: 'grid-cols-6', md: 'md:grid-cols-6', lg: 'lg:grid-cols-6' },
}

const gapMap: Record<string, Partial<Record<'default' | 'md' | 'lg', string>>> = {
  'none': { default: 'gap-0', md: 'md:gap-0', lg: 'lg:gap-0' },
  'xs': { default: 'gap-0.5', md: 'md:gap-0.5', lg: 'lg:gap-0.5' },
  'sm': { default: 'gap-4', md: 'md:gap-6', lg: 'lg:gap-8' },
  'md': { default: 'gap-8', md: 'md:gap-12', lg: 'lg:gap-16' },
  'lg': { default: 'gap-10', md: 'md:gap-16', lg: 'lg:gap-20' },
  'xl': { default: 'gap-12', md: 'md:gap-20', lg: 'lg:gap-24' },
  '2xl': { default: 'gap-16', md: 'md:gap-24', lg: 'lg:gap-32' },
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

interface GridBlockProps {
  block: ResolvedBlock<'grid'>
  children: ReactNode
}

export default function GridBlock(props: GridBlockProps) {
  const { block, children } = props
  const { cols, gap, alignItems, className } = block.props

  const colClasses = resolveResponsive(cols || { default: 1 }, colsMap)

  const gapClasses = resolveResponsive(gap || { default: 'none' }, gapMap)

  const alignClass = alignMap[alignItems || 'start']

  return (
    <div
      className={['grid', colClasses, gapClasses, alignClass, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
