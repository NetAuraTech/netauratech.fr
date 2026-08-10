import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import { resolveFileForRender } from '#services/file/file_resolver'
import FileNotFoundException from '#exceptions/file/file_not_found_exception'
import type { ResolvedFile } from '#types/file'

interface FindFilePayload {
  id: number
  locale?: string
  altKey?: string | null
  altOverride?: string | null
}

/**
 * Resolve a file by id for a manual front page.
 *
 * Loads the File with its alt texts and returns the render-ready `ResolvedFile`
 * prop — public URL, responsive variants and final alt resolved server-side.
 * The display intent (`locale`, `altKey`, `altOverride`) is declared at
 * resolution time so the front stays dumb. Throws a dedicated
 * {@link FileNotFoundException} when the id does not exist.
 */
@inject()
export class FindFileAction {
  constructor(
    protected fileRepository: FileRepository,
    protected imageOptimizer: ImageOptimizerService
  ) {}

  /**
   * Execute file resolution.
   *
   * @param payload - The file ID plus optional display intent.
   * @returns A {@link ResolvedFile} prop safe to pass to an Inertia page.
   * @throws {FileNotFoundException} When no file exists for the given id.
   *
   * @example
   * const hero = await findFileAction.execute({ id: 1, locale: 'en', altKey: 'hero' })
   */
  async execute(payload: FindFilePayload): Promise<ResolvedFile> {
    const file = await this.fileRepository.findById(payload.id)

    if (!file) {
      throw new FileNotFoundException(payload.id)
    }

    return resolveFileForRender(file, payload, this.imageOptimizer)
  }
}
