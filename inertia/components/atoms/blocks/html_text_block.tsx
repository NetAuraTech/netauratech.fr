import type { ResolvedBlock } from '#types/page'
import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface HtmlTextBlockProps {
  block: ResolvedBlock<'htmltext'>
}

/**
 * Renders a HTML text.
 */
export default function HtmlTextBlock({ block }: HtmlTextBlockProps) {
  const { content } = block.props

  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        em: ({ node, ...props }) => <em className="text-secondary" {...props} />,
        strong: ({ node, ...props }) => <strong {...props} />,
        p: Fragment,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
