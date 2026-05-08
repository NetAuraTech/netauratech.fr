import type { ResolvedBlock } from '#types/page'
import { ReactNode } from 'react'
import { Form } from '@adonisjs/inertia/react'

interface FormBlockProps {
  block: ResolvedBlock<'form'>
  children?: ReactNode
}

/**
 * Wrapper block that defines a form
 * All visual child blocks are rendered inside this container.
 */
export default function FormBlock(props: FormBlockProps) {
  const { block, children } = props
  const { route, routeParams, className } = block.props

  const Component = route === null ? Div : Form

  return (
    <Component
      className={['grid', 'gap-4', className].filter(Boolean).join(' ')}
      route={route as any}
      routeParams={routeParams}
    >
      {children}
    </Component>
  )
}

function Div({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
