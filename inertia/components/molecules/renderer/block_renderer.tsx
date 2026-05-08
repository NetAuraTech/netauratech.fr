import type { ResolvedBlock } from '#types/page'
import SectionBlock from '~/components/atoms/blocks/section_block'
import TitleBlock from '~/components/atoms/blocks/title_block'
import ImageBlock from '~/components/atoms/blocks/image_block'
import GridBlock from '~/components/atoms/blocks/grid_block'
import ButtonBlock from '~/components/atoms/blocks/button_block'
import SeparatorBlock from '~/components/atoms/blocks/separator_block'
import FlexBlock from '~/components/atoms/blocks/flex_block'
import ParagraphBlock from '~/components/atoms/blocks/paragraph_block'
import IconBlock from '~/components/atoms/blocks/icon_block'
import FormBlock from '~/components/atoms/blocks/form_block'
import FieldBlock from '~/components/atoms/blocks/field_block'
import HtmlTextBlock from '~/components/atoms/blocks/html_text_block'

interface BlockRendererProps {
  block: ResolvedBlock
  pageId: number
  locale: string
  isPriority?: boolean
}

/**
 * Dispatches a single resolved block to the correct component.
 *
 * Container blocks (`section`, `grid`) receive their `children` rendered
 * recursively via this same component.
 */
export default function BlockRenderer({
  block,
  pageId,
  locale,
  isPriority = false,
}: BlockRendererProps) {
  switch (block.type) {
    case 'section':
      return (
        <SectionBlock block={block as ResolvedBlock<'section'>}>
          {block.children?.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              pageId={pageId}
              locale={locale}
              isPriority={isPriority}
            />
          ))}
        </SectionBlock>
      )
    case 'grid':
      return (
        <GridBlock block={block as ResolvedBlock<'grid'>}>
          {block.children?.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              pageId={pageId}
              locale={locale}
              isPriority={isPriority}
            />
          ))}
        </GridBlock>
      )
    case 'flex':
      return (
        <FlexBlock block={block as ResolvedBlock<'flex'>}>
          {block.children?.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              pageId={pageId}
              locale={locale}
              isPriority={isPriority}
            />
          ))}
        </FlexBlock>
      )
    case 'title':
      return <TitleBlock block={block as ResolvedBlock<'title'>} />
    case 'paragraph':
      return <ParagraphBlock block={block as ResolvedBlock<'paragraph'>} />
    case 'button':
      return <ButtonBlock block={block as ResolvedBlock<'button'>} />
    case 'separator':
      return <SeparatorBlock block={block as ResolvedBlock<'separator'>} />
    case 'icon':
      return <IconBlock block={block as ResolvedBlock<'icon'>} />
    case 'form':
      return (
        <FormBlock block={block as ResolvedBlock<'form'>}>
          {block.children?.map((child) => (
            <BlockRenderer
              key={child.id}
              block={child}
              pageId={pageId}
              locale={locale}
              isPriority={isPriority}
            />
          ))}
        </FormBlock>
      )
    case 'field':
      return <FieldBlock block={block as ResolvedBlock<'field'>} />
    case 'htmltext':
      return <HtmlTextBlock block={block as ResolvedBlock<'htmltext'>} />
    case 'image':
      return <ImageBlock block={block as ResolvedBlock<'image'>} isPriority={isPriority} />
    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[BlockRenderer] Unknown block type: ${(block as any).type}`)
      }
      return null
  }
}
