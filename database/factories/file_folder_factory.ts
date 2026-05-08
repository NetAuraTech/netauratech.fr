import factory from '@adonisjs/lucid/factories'
import FileFolder from '#models/file/file_folder'

export const FileFolderFactory = factory
  .define(FileFolder, async ({ faker }) => {
    return {
      name: faker.system.directoryPath().split('/').pop() ?? faker.word.noun(),
      parentId: null,
    }
  })
  .build()
