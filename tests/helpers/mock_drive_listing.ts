import type { Disk } from 'flydrive'

/**
 * Module-level storage keyed by disk instance. This is the single source of
 * truth for tracked files — `listAll` reads from it and `put` writes to it.
 */
const diskStores = new WeakMap<Disk, Map<string, string>>()

/**
 * Mock `listAll` on a fake disk. The Flydrive fake supports put/get/delete
 * but not listing, so we track files written via `put` and return them as
 * fake `DriveFile`-like objects from `listAll`.
 *
 * @param disk - The fake disk instance to patch.
 * @returns A map of stored files (key → content) for assertions if needed.
 */
export function mockDriveListing(disk: Disk): Map<string, string> {
  // Create a fresh store for this disk — clears any leftover state from previous tests
  const storedFiles = new Map<string, string>()
  diskStores.set(disk, storedFiles)

  // Save original put so the underlying fake storage still works
  const originalPut = (disk as any)._originalPut ?? disk.put.bind(disk)
  ;(disk as any)._originalPut = originalPut

  disk.put = async function (key: string, value: string | Uint8Array) {
    const content = typeof value === 'string' ? value : Buffer.from(value).toString()
    storedFiles.set(key, content)
    return originalPut(key, value)
  }
  ;(disk as any).listAll = async (prefix?: string) => {
    const prefixStr = String(prefix || '')
    const objects = Array.from(storedFiles.entries())
      .filter(([key]) => key.startsWith(prefixStr))
      .map(([key, value]) => createFakeDriveFile(key, value))
    return { objects }
  }

  // Patch getMetaData so the action gets deterministic dates from filenames
  ;(disk as any).getMetaData = async (key: string) => {
    const content = storedFiles.get(key)
    if (!content) throw new Error(`File not found: ${key}`)
    return {
      contentLength: Buffer.byteLength(content, 'utf8'),
      etag: 'test-etag',
      lastModified: parseDateFromBackupFilename(key) || new Date(),
    }
  }

  return storedFiles
}

/**
 * Clear all tracked files for a disk. Call this in test teardown to ensure
 * no leftover state leaks between tests.
 */
export function clearMockDriveListing(disk: Disk): void {
  const store = diskStores.get(disk)
  if (store) {
    store.clear()
  }
}

function createFakeDriveFile(key: string, content: string) {
  const lastModified = parseDateFromBackupFilename(key) || new Date()

  return {
    key,
    name: key.split('/').pop()!,
    isFile: true as const,
    isDirectory: false as const,
    getMetaData: async () => ({
      contentLength: Buffer.byteLength(content, 'utf8'),
      etag: 'test-etag',
      lastModified,
    }),
  }
}

/**
 * Extracts a deterministic Date from a backup filename like
 * `backup-full-2024-01-15-143022.sql.gz.enc`. Returns null if no date found.
 */
function parseDateFromBackupFilename(key: string): Date | null {
  const match = key.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
  if (!match) return null

  const [, , date, time] = match
  const [year, month, day] = date.split('-').map(Number)
  const hour = Number.parseInt(time.slice(0, 2))
  const minute = Number.parseInt(time.slice(2, 4))
  const second = Number.parseInt(time.slice(4, 6))
  return new Date(year, month - 1, day, hour, minute, second)
}
