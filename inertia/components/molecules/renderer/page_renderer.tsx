import type { ResolvedPageContent } from '#types/page'
import BlockRenderer from '~/components/molecules/renderer/block_renderer'

interface PageRendererProps {
  content: ResolvedPageContent
  pageId: number
  locale: string
}

/**
 * Root renderer for a resolved CMS page.
 * Iterates over the top-level block array and delegates each block to
 * `BlockRenderer`. Container blocks handle their own children recursively.
 */
export default function PageRenderer({ content, pageId, locale }: PageRendererProps) {
  if (!content.blocks.length) return null

  return (
    <main>
      {content.blocks.map((block, index) => (
        <BlockRenderer
          key={block.id}
          block={block}
          pageId={pageId}
          locale={locale}
          isPriority={index < 2}
        />
      ))}
    </main>
  )
}
