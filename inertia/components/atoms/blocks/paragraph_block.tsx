import type { ResolvedBlock } from '#types/page'
import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Paragraph } from '~/components/atoms/paragraph'

interface ParagraphBlockProps {
  block: ResolvedBlock<'paragraph'>
}

/**
 * Renders a Paragraph with configurable variant.
 * Reuses the semantic HTML paragraph element so the page outline stays correct.
 */
export default function ParagraphBlock({ block }: ParagraphBlockProps) {
  const { text, fs, variant, spacing, className } = block.props

  return (
    <Paragraph variant={variant} fs={fs} className={className} spacing={spacing}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          em: ({ node, ...props }) => <em className="text-secondary" {...props} />,
          strong: ({ node, ...props }) => <strong {...props} />,
          p: Fragment,
        }}
      >
        {text}
      </ReactMarkdown>
    </Paragraph>
  )
}
