import Markdown from 'react-markdown'
import { Paragraph } from '~/components/atoms/paragraph'
import type { ProjectBlock } from '#types/site_content'

/**
 * Opening lede of a project story.
 *
 * The intro rendered at a larger scale — the strongest typographic statement
 * of the story — keeping the mauve-accented bold of the source.
 *
 * @example
 * <ProjectLede block={{ type: 'lede', body: 'Un boilerplate de référence…' }} />
 */
export function ProjectLede({ block }: { block: Extract<ProjectBlock, { type: 'lede' }> }) {
  return (
    <Markdown
      components={{
        p: ({ children }) => (
          <Paragraph
            fs={['lg', 'md:xl']}
            spacing="base"
            className="max-w-3xl font-news font-light leading-relaxed text-ink-inverted/80"
          >
            {children}
          </Paragraph>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-primary-soft">{children}</strong>
        ),
      }}
    >
      {block.body}
    </Markdown>
  )
}
