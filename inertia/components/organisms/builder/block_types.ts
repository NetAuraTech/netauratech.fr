import type { BlockType, Block } from '#types/page'

export interface BlockDescriptor {
  type: BlockType
  label: string
  icon: string
  description: string
  isContainer: boolean
  defaultProps: Block['props']
}

/**
 * Catalogue of all available block types with their default props.
 * Used by the block picker panel in the page builder.
 */
export const BLOCK_CATALOG: BlockDescriptor[] = [
  {
    type: 'section',
    label: 'Section',
    icon: 'layout',
    description: 'Full-width container with background and spacing',
    isContainer: true,
    defaultProps: {
      background: 'none',
      paddingY: { default: 'md' },
      paddingX: { default: 'md' },
      className: '',
      id: '',
    },
  },
  {
    type: 'grid',
    label: 'Grid',
    icon: 'grid',
    description: 'Multi-column layout container',
    isContainer: true,
    defaultProps: {
      cols: { default: 1, md: 2 },
      gap: { default: 'md' },
      className: '',
    },
  },
  {
    type: 'flex',
    label: 'Flex Container',
    icon: 'layers',
    description: 'Boîte flexible (Stack) pour aligner des éléments',
    isContainer: true,
    defaultProps: {
      as: 'div',
      background: 'none',
      direction: { default: 'col', md: 'row' },
      gap: { default: 'sm' },
      align: 'center',
      justify: 'start',
      wrap: false,
      className: '',
    },
  },
  {
    type: 'title',
    label: 'Heading',
    icon: 'type',
    description: 'H1–H4 heading',
    isContainer: false,
    defaultProps: {
      text: 'New heading',
      level: 2,
      color: 'default',
      highlightColor: 'default',
    },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: 'paragraph',
    description: 'p text',
    isContainer: false,
    defaultProps: {
      text: 'New paragraph',
      variant: 'ink',
      fs: 'base',
      spacing: 'base',
      className: '',
    },
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'mouse-pointer',
    description: 'Button with link',
    isContainer: false,
    defaultProps: {
      label: 'Click here',
      variant: 'primary',
      size: 'md',
      align: 'left',
      linkType: 'route',
      fitContent: true,
      children: '',
      icon: '',
    },
  },
  {
    type: 'separator',
    label: 'Separator',
    icon: 'minus',
    description: 'Horizontal dividing line',
    isContainer: false,
    defaultProps: {
      spacing: 'none',
      color: 'default',
      className: '',
    } as any,
  },
  {
    type: 'icon',
    label: 'Icon',
    icon: 'icon',
    description: 'Icon',
    isContainer: false,
    defaultProps: {
      name: '',
      color: 'default',
      background: 'none',
      size: 16,
      className: '',
    } as any,
  },
  {
    type: 'form',
    label: 'Form',
    icon: 'form',
    description: 'Form',
    isContainer: true,
    defaultProps: {
      route: 'contact.execute',
      routeParams: {},
      className: '',
    },
  },
  {
    type: 'field',
    label: 'Field',
    icon: 'field',
    description: 'Field',
    isContainer: false,
    defaultProps: {
      label: 'My field',
      name: '',
      type: 'text',
      placeholder: '',
      required: false,
      helpText: '',
      options: [],
    },
  },
  {
    type: 'htmltext',
    label: 'Html Text',
    icon: 'htmltext',
    description: 'Html text',
    isContainer: false,
    defaultProps: {
      content: '<span>New text</span>',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'image',
    description: 'Single image from the media library',
    isContainer: false,
    defaultProps: {
      file: null,
      className: '',
    },
  },
]

/** Returns the descriptor for a given block type, or undefined */
export function getBlockDescriptor(type: BlockType): BlockDescriptor | undefined {
  return BLOCK_CATALOG.find((b) => b.type === type)
}

/** Generates a unique block ID */
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Creates a new block with defaults for the given type */
export function createBlock(type: BlockType): Block {
  const descriptor = getBlockDescriptor(type)
  if (!descriptor) throw new Error(`Unknown block type: ${type}`)

  return {
    id: generateBlockId(),
    type,
    props: { ...descriptor.defaultProps } as Block['props'],
    children: descriptor.isContainer ? [] : undefined,
  }
}
