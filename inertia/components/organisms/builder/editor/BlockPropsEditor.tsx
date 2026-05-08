import type { Block, BlockType } from '#types/page'
import type { LockState } from '~/hooks/use_builder_sync'
import { LockProps } from '~/types/builder'
import { SectionEditor } from '~/components/organisms/builder/editor/blocks/section_editor'
import { GridEditor } from '~/components/organisms/builder/editor/blocks/grid_editor'
import { FlexEditor } from '~/components/organisms/builder/editor/blocks/flex_editor'
import { TitleEditor } from '~/components/organisms/builder/editor/blocks/title_editor'
import { ParagraphEditor } from '~/components/organisms/builder/editor/blocks/paragraph_editor'
import { ButtonEditor } from '~/components/organisms/builder/editor/blocks/button_editor'
import { SeparatorEditor } from '~/components/organisms/builder/editor/blocks/separator_editor'
import { IconEditor } from '~/components/organisms/builder/editor/blocks/icon_editor'
import { FormEditor } from '~/components/organisms/builder/editor/blocks/form_editor'
import { FieldEditor } from '~/components/organisms/builder/editor/blocks/field_editor'
import { HtmlTextEditor } from '~/components/organisms/builder/editor/blocks/html_text_editor'
import { ImageEditor } from '~/components/organisms/builder/editor/blocks/image_editor'

interface BlockPropsEditorProps {
  block: Block
  onChange: (props: Block['props']) => void
  getLock?: (blockId: string, fieldKey: string) => LockState | null
  acquireLock?: (blockId: string, fieldKey: string) => Promise<{ acquired: boolean; lock?: any }>
  releaseLock?: (blockId: string, fieldKey: string) => Promise<void>
  currentUserId?: number
}

export default function BlockPropsEditor(props: BlockPropsEditorProps) {
  const { block, onChange, getLock, acquireLock, releaseLock, currentUserId = 0 } = props
  const lockProps: LockProps = {
    blockId: block.id,
    getLock,
    acquireLock,
    releaseLock,
    currentUserId,
  }

  switch (block.type as BlockType) {
    case 'section':
      return <SectionEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'grid':
      return <GridEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'flex':
      return <FlexEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'title':
      return <TitleEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'paragraph':
      return <ParagraphEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'button':
      return <ButtonEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'separator':
      return <SeparatorEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'icon':
      return <IconEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'form':
      return <FormEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'field':
      return <FieldEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'htmltext':
      return <HtmlTextEditor block={block} onChange={onChange} lockProps={lockProps} />
    case 'image':
      return <ImageEditor block={block} onChange={onChange} lockProps={lockProps} />
    default:
      return <p className="text-xs text-ink-subtle">No editable props.</p>
  }
}
