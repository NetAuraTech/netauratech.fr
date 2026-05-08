import { BaseTransformer } from '@adonisjs/core/transformers'
import type FileFolder from '#models/file/file_folder'

type FileFolderObject = {
  id: number
  name: string
  parentId: number | null
  children: FileFolderObject[]
}

export default class FileFolderTransformer extends BaseTransformer<FileFolder> {
  async toObject(): Promise<FileFolderObject> {
    if (!this.resource.children) {
      await this.resource.load('children')
    }

    const children = await Promise.all(
      this.resource.children.map((child) => new FileFolderTransformer(child).toObject())
    )

    return {
      ...this.pick(this.resource, ['id', 'name', 'parentId']),
      children,
    }
  }
}
