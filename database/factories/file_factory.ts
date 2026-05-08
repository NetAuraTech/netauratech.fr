import factory from '@adonisjs/lucid/factories'
import CmsFile from '#models/file/file'
import { FileFolderFactory } from '#factories/file_folder_factory'

export const FileFactory = factory
  .define(CmsFile, async ({ faker }) => {
    const ext = faker.helpers.arrayElement(['jpg', 'png', 'pdf', 'mp4'])
    const filename = `${faker.string.uuid()}.${ext}`

    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
    }

    return {
      filename,
      originalName: faker.system.fileName(),
      mimeType: mimeMap[ext],
      extension: ext,
      size: faker.number.int({ min: 1024, max: 10 * 1024 * 1024 }),
      path: `cms/files/${filename}`,
      disk: 'fs' as const,
      folderId: null,
      uploadedBy: null,
    } as Partial<File>
  })
  .relation('folder', () => FileFolderFactory)
  .build()
