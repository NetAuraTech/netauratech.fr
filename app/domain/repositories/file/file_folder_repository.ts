import FileFolder from '#models/file/file_folder'

export class FileFolderRepository {
  async findById(id: number): Promise<FileFolder | null> {
    return FileFolder.find(id)
  }

  async listRoots(): Promise<FileFolder[]> {
    return FileFolder.query()
      .apply((s) => s.roots())
      .orderBy('name', 'asc')
  }

  async listChildren(parentId: number): Promise<FileFolder[]> {
    return FileFolder.query().where('parent_id', parentId).orderBy('name', 'asc')
  }

  async create(data: { name: string; parentId?: number | null }): Promise<FileFolder> {
    return FileFolder.create({
      name: data.name,
      parentId: data.parentId ?? null,
    })
  }

  async update(
    folder: FileFolder,
    data: Partial<{ name: string; parentId: number | null }>
  ): Promise<FileFolder> {
    folder.merge(data)
    await folder.save()
    return folder
  }

  /**
   * Deletes a folder. Files inside are NOT deleted — they are moved to root
   * (folder_id set to null) via the SET NULL FK constraint.
   * Child folders are also set to root via the same constraint.
   */
  async delete(id: number): Promise<void> {
    const folder = await FileFolder.findOrFail(id)
    await folder.delete()
  }
}
