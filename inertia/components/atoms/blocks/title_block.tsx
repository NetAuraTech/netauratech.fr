import type { ResolvedBlock } from '#types/page'
import { Heading } from '~/components/atoms/heading'
import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

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

interface TitleBlockProps {
  block: ResolvedBlock<'title'>
}

/**
 * Renders a heading at levels 1–4 with configurable alignment and colour.
 * Reuses the semantic HTML heading element so the page outline stays correct.
 */
export default function TitleBlock({ block }: TitleBlockProps) {
  const { text, level, color, highlightColor } = block.props

  return (
    <Heading level={level} color={colorMap[color ?? 'default'] ?? 'text-ink'}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          em: ({ node, ...props }) => <em className={`${colorMap[highlightColor]}`} {...props} />,
          strong: ({ node, ...props }) => (
            <strong className={`${colorMap[highlightColor]}`} {...props} />
          ),
          p: Fragment,
        }}
      >
        {text}
      </ReactMarkdown>
    </Heading>
  )
}
