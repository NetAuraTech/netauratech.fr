import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'
import { StorageService } from '#services/file/storage_service'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import type CmsFile from '#models/file/file'
import type { Block, PageContent, BlockType, ImageProps } from '#types/page'
import type { ResolvedBlock, ResolvedPageContent, ResolvedImageProps } from '#types/page'
import type { FileRef, ResolvedFile } from '#types/file'

@inject()
export class PageResolverService {
  constructor(
    protected fileRepository: FileRepository,
    protected storageService: StorageService,
    protected imageOptimizerService: ImageOptimizerService
  ) {}

  /**
   * Resolves all `FileRef` values in a `PageContent` tree into `ResolvedFile`
   * objects, batching all file lookups into a single DB query.
   *
   * The original `content` is not mutated — a parallel `ResolvedPageContent`
   * structure is returned. This keeps the stored JSON clean and the resolved
   * representation strictly typed.
   *
   * @param content - The raw `PageContent` stored in `page_translations.content`
   * @param locale - The current page locale, used to resolve named alt texts
   * @returns A `ResolvedPageContent` safe to serialize into Inertia props
   */
  async resolve(content: PageContent, locale: string): Promise<ResolvedPageContent> {
    const fileIds = this.collectFileIds(content.blocks)

    const fileMap = await this.loadFiles(fileIds)

    const blocks = await this.resolveBlocks(content.blocks, locale, fileMap)

    return { blocks }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Recursively collects all unique file IDs referenced anywhere in the block tree.
   * A single pass avoids N+1 queries when the page has many image blocks.
   */
  private collectFileIds(blocks: Block[]): number[] {
    const ids = new Set<number>()

    const visit = (block: Block) => {
      if (block.type === 'image') {
        const props = block.props as ImageProps
        if (props.file?.fileId) ids.add(props.file.fileId)
      }

      if (block.children?.length) {
        block.children.forEach(visit)
      }
    }

    blocks.forEach(visit)

    return Array.from(ids)
  }

  /**
   * Loads all required files with their alts in a single query and builds
   * an in-memory map keyed by file ID for O(1) lookup during resolution.
   *
   * @param ids - Array of file IDs to load
   */
  private async loadFiles(ids: number[]): Promise<Map<number, CmsFile>> {
    if (ids.length === 0) return new Map()

    const { default: CmsFileModel } = await import('#models/file/file')

    const files = await CmsFileModel.query().whereIn('id', ids).preload('alts')

    return new Map(files.map((f) => [f.id, f]))
  }

  /**
   * Recursively resolves a block array, replacing `FileRef` props with
   * `ResolvedFile` objects using the pre-loaded file map.
   */
  private async resolveBlocks(
    blocks: Block[],
    locale: string,
    fileMap: Map<number, CmsFile>
  ): Promise<ResolvedBlock[]> {
    const resolved: ResolvedBlock[] = []

    for (const block of blocks) {
      const children = block.children?.length
        ? await this.resolveBlocks(block.children, locale, fileMap)
        : undefined

      resolved.push({
        id: block.id,
        type: block.type,
        props: await this.resolveProps(block, locale, fileMap),
        ...(children !== undefined && { children }),
      } as ResolvedBlock)
    }

    return resolved
  }

  /**
   * Resolves a single block's props. For blocks without `FileRef` fields the
   * original props object is returned as-is (no copy needed — it's read-only).
   */
  private async resolveProps(
    block: Block,
    locale: string,
    fileMap: Map<number, CmsFile>
  ): Promise<ResolvedBlock['props']> {
    switch (block.type as BlockType) {
      case 'image': {
        const props = block.props as ImageProps
        return {
          ...props,
          file: props.file ? await this.resolveFileRef(props.file, locale, fileMap) : null,
        } satisfies ResolvedImageProps
      }

      default:
        // section, title, rich_text, grid, button_cta, separator, contact_form
        // none of these have FileRef fields — return props unchanged
        return block.props as ResolvedBlock['props']
    }
  }

  /**
   * Converts a `FileRef` into a `ResolvedFile` using the pre-loaded file map.
   * Returns `null` when the referenced file is not found (deleted or invalid ID).
   *
   * @param ref - The FileRef to resolve
   * @param locale - Current locale for alt text resolution
   * @param fileMap - Pre-loaded file map
   */
  private async resolveFileRef(
    ref: FileRef,
    locale: string,
    fileMap: Map<number, CmsFile>
  ): Promise<ResolvedFile | null> {
    const file = fileMap.get(ref.fileId)

    if (!file) return null

    const url = await file.url()
    const alt = file.resolveAlt(locale, ref.altKey ?? null, ref.altOverride)

    const optimized = await this.imageOptimizerService.optimize(file)

    return {
      id: file.id,
      url,
      filename: file.filename,
      mimeType: file.mimeType,
      extension: file.extension,
      size: file.size as number,
      alt,
      width: optimized.width,
      height: optimized.height,
      variants: optimized.variants,
    }
  }
}
