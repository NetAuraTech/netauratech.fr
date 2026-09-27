import type { FindFileAction } from '#actions/file/find_file_action'
import FileNotFoundException from '#exceptions/file/file_not_found_exception'
import type { SiteProject } from '#types/site_content'
import type { ResolvedFile } from '#types/file'

/**
 * Resolve the `cover` file id of every project into its render-ready file prop.
 *
 * A shared read-only transform (function module) used by the listing
 * controllers: each project's `cover` frontmatter id is fetched through the
 * {@link FindFileAction} once, then attached back as `coverFile` so the Inertia
 * view receives plain data with no further DB or storage calls. A cover whose
 * file no longer exists leaves `coverFile` unset (the front renders its
 * placeholder frame) instead of crashing the whole listing.
 *
 * @param projects - The parsed project catalogue.
 * @param findFile - File resolution action, injected by the calling controller.
 * @returns The same catalogue with `coverFile` set on every project that resolves.
 */
export async function resolveProjectCovers(
  projects: SiteProject[],
  findFile: FindFileAction
): Promise<SiteProject[]> {
  const ids = Array.from(new Set(projects.map((project) => project.cover)))

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        return await findFile.execute({ id })
      } catch (error) {
        if (error instanceof FileNotFoundException) {
          return null
        }
        throw error
      }
    })
  )

  const filesById = new Map<number, ResolvedFile>()
  for (const [index, id] of ids.entries()) {
    const file = results[index]
    if (file) {
      filesById.set(id, file)
    }
  }

  return projects.map((project) => ({
    ...project,
    coverFile: filesById.get(project.cover),
  }))
}
