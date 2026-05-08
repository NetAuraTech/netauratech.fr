import { Button } from '~/components/atoms/button'
import type { ResolvedBlock } from '#types/page'
import { urlFor } from '~/client'

interface ButtonBlockProps {
  block: ResolvedBlock<'button'>
}
export default function ButtonBlock(props: ButtonBlockProps) {
  const { block } = props
  const p = block.props

  let finalProps: any = {
    variant: p.variant,
    fitContent: p.fitContent,
    children: p.children,
  }

  if (p.linkType === 'external') {
    finalProps.href = p.url
    finalProps.external = true
  } else if (p.route) {
    if (p.anchor) {
      const baseUrl = urlFor(p.route as any, p.routeParams as any)
      finalProps.href = `${baseUrl}#${p.anchor}`
      finalProps.external = true
    } else {
      finalProps.route = p.route
      finalProps.routeParams = p.routeParams
    }
  }

  return <Button {...finalProps} />
}
