import { test } from '@japa/runner'
import { resolveProjectCovers } from '#services/core/project_covers'
import FileNotFoundException from '#exceptions/file/file_not_found_exception'
import type { FindFileAction } from '#actions/file/find_file_action'
import type { SiteProject } from '#types/site_content'
import type { ResolvedFile } from '#types/file'

/**
 * Unit tests for `resolveProjectCovers`.
 *
 * The helper turns each project's `cover` file id into the render-ready
 * `coverFile` prop the listing pages consume, fetching a shared id only once
 * and tolerating covers whose file no longer exists.
 */
test.group('resolveProjectCovers', () => {
  test('resolves every project cover id into a coverFile', async ({ assert }) => {
    const findFile = {
      execute: async ({ id }: { id: number }) => resolvedFile(id),
    } as unknown as FindFileAction
    const projects: SiteProject[] = [project('a', 1), project('b', 2)]

    const result = await resolveProjectCovers(projects, findFile)

    assert.equal(result[0].coverFile?.id, 1)
    assert.equal(result[1].coverFile?.id, 2)
    assert.equal(result[0].cover, 1)
  })

  test('keeps coverFile unset when the cover file no longer exists', async ({ assert }) => {
    const findFile = {
      execute: async ({ id }: { id: number }) => {
        if (id === 2) {
          throw new FileNotFoundException(2)
        }
        return resolvedFile(id)
      },
    } as unknown as FindFileAction
    const projects: SiteProject[] = [project('a', 1), project('b', 2)]

    const result = await resolveProjectCovers(projects, findFile)

    assert.equal(result[0].coverFile?.id, 1)
    assert.equal(result[1].coverFile, undefined)
  })

  test('fetches a shared cover id only once', async ({ assert }) => {
    let calls = 0
    const findFile = {
      execute: async ({ id }: { id: number }) => {
        calls += 1
        return resolvedFile(id)
      },
    } as unknown as FindFileAction
    const projects: SiteProject[] = [project('a', 1), project('b', 1)]

    const result = await resolveProjectCovers(projects, findFile)

    assert.equal(calls, 1)
    assert.equal(result[0].coverFile?.id, result[1].coverFile?.id)
  })
})

/** Build a minimal parsed project entry for the tests. */
function project(slug: string, cover: number): SiteProject {
  return { slug, cover, rubrique: 'Application web', title: slug, note: 'note', blocks: [] }
}

/** Build a minimal resolved file prop for the tests. */
function resolvedFile(id: number): ResolvedFile {
  return {
    id,
    url: `https://files.test/${id}.png`,
    filename: `${id}.png`,
    mimeType: 'image/png',
    extension: 'png',
    size: 1024,
    type: 'image',
    alt: `Fichier ${id}`,
  }
}
