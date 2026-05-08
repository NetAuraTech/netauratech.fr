import type { BlockType } from '#types/page'

export type TemplateType = 'page' | 'block'

/**
 * A template can cover either a full page layout or a single pre-configured block.
 * When `type` is `'block'`, `blockType` identifies which block it applies to.
 *
 * @example
 * // Page template
 * { type: 'page', blockType: null }
 *
 * // Block template for a hero
 * { type: 'block', blockType: 'hero' }
 */
export interface TemplateTypeDescriptor {
  type: TemplateType
  blockType: BlockType | null
}
