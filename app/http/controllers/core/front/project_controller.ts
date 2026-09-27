import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { SiteContentService } from '#services/core/site_content_service'
import { FindFileAction } from '#actions/file/find_file_action'
import FileNotFoundException from '#exceptions/file/file_not_found_exception'
import { buildProjectsPayload } from '#helpers/i18n_payloads/projects'
import type { ProjectBlock, ProjectGalleryFileRef, SiteProject } from '#types/site_content'
import type { ResolvedFile } from '#types/file'

/**
 * Serves the hand-written single page of one project.
 *
 * The page is content-driven: the entry comes from the committed markdown
 * source in `content/projects/{slug}.md`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes. `::gallery` references to
 * backend files (`id:N`) are resolved server-side here via the
 * {@link FindFileAction} so the view receives render-ready props.
 */
@inject()
export default class ProjectController {
  constructor(
    protected i18n: I18nService,
    protected siteContent: SiteContentService,
    protected findFile: FindFileAction
  ) {}

  /**
   * `GET /projets/:slug` — renders the project page as `front.projects.show`
   * with the entry resolved from the URL slug, the ordered catalogue (used to
   * lead to the next project), the resolved gallery files and the project
   * translations.
   *
   * @returns The Inertia-rendered `core/front/project` page.
   */
  async render({ inertia, params }: HttpContext) {
    const [project, projects] = await Promise.all([
      this.siteContent.getProjectBySlug(params.slug),
      this.siteContent.getProjects(),
    ])

    return inertia.render('core/front/project', {
      translations: buildProjectsPayload(this.i18n),
      project: await this.resolveGalleryFiles(project),
      projects,
    })
  }

  /**
   * Replace every `::gallery` file reference with the resolved backend file.
   *
   * Extracts the `fileId` references from the project's gallery blocks, fetches
   * each through the {@link FindFileAction} (applying the inline alt as an
   * override when present), and rebuilds the blocks so gallery images already
   * carry their render-ready `ResolvedFile` prop. References whose file no
   * longer exists are dropped silently, keeping the page up with a shorter
   * gallery instead of failing the request. Projects without file references
   * are returned untouched.
   *
   * @param project - The parsed project entry.
   * @returns The project with gallery file references swapped for resolved files.
   */
  private async resolveGalleryFiles(project: SiteProject): Promise<SiteProject> {
    const fileRefs = project.blocks
      .flatMap((block) => (block.type === 'gallery' ? block.images : []))
      .filter((image): image is ProjectGalleryFileRef => 'fileId' in image)

    if (fileRefs.length === 0) {
      return project
    }

    const resolved = await Promise.all(
      fileRefs.map(async (image) => {
        try {
          return await this.findFile.execute({ id: image.fileId, altOverride: image.alt ?? null })
        } catch (error) {
          if (error instanceof FileNotFoundException) {
            return null
          }
          throw error
        }
      })
    )

    const filesById = new Map<number, ResolvedFile>()
    for (const [index, image] of fileRefs.entries()) {
      const file = resolved[index]
      if (file) {
        filesById.set(image.fileId, file)
      }
    }

    return {
      ...project,
      blocks: project.blocks.map((block) => resolveGalleryImages(block, filesById)),
    }
  }
}

/**
 * Resolve the file references of one block, leaving non-gallery blocks untouched.
 *
 * @param block - One project story block.
 * @param filesById - Resolved files keyed by their id.
 * @returns The block with each `fileId` gallery reference replaced by its
 * resolved file; references without a resolved file are dropped.
 */
function resolveGalleryImages(
  block: ProjectBlock,
  filesById: ReadonlyMap<number, ResolvedFile>
): ProjectBlock {
  if (block.type !== 'gallery') {
    return block
  }

  return {
    ...block,
    images: block.images.flatMap((image) => {
      if ('file' in image) {
        return [image]
      }
      const resolved = filesById.get(image.fileId)
      return resolved ? [{ file: resolved }] : []
    }),
  }
}
