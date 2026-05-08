/**
 * The set of storage drivers supported by the CMS filesystem.
 * Mirrors the disk keys declared in `config/drive.ts`.
 */
export type StorageDisk = 'fs' | 's3' | 'r2'

/**
 * A file reference embedded in a block's props.
 *
 * `altKey` identifies the named alt entry to resolve from `file_alts`
 * for the current page locale. `altOverride` is an optional inline
 * alt text that bypasses the named system entirely — use it when the
 * same file needs a context-specific description on a single block.
 *
 * @example
 * // Named alt — resolved automatically per locale
 * { fileId: 12, altKey: 'hero', altOverride: null }
 *
 * // Inline override — ignores file_alts
 * { fileId: 12, altKey: null, altOverride: 'Custom description for this block' }
 */
export interface FileRef {
  fileId: number
  altKey: string | null
  altOverride?: string | null
}

/**
 * A fully resolved file object passed to the page renderer.
 * All async lookups (URL generation, alt resolution) are performed server-side
 * so React components receive plain data with no further DB or storage calls.
 */
export interface ResolvedFile {
  id: number
  url: string
  filename: string
  mimeType: string
  extension: string
  size: number
  alt: string
  width?: number
  height?: number
  variants?: Record<number, string>
}
