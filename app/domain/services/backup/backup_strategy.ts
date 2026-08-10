/**
 * BackupStrategy — Common interface for all backup strategies.
 *
 * Each strategy implements its own execution logic (dump, compress,
 * encrypt, manifest, upload) while sharing the same contract.
 */

export interface BackupResult {
  success: boolean
  filename: string
  type: 'full' | 'differential'
  size: number
  duration: number
  storage: string
  error?: string
}

export interface BackupManifest {
  type: 'full' | 'differential'
  createdAt: string
  tables: string[]
  fullBackupReference?: string
}

export interface BackupMetadata {
  filename: string
  type: 'full' | 'differential'
  size: number
  createdAt: Date
  path: string
}

export interface BackupStrategy {
  execute(): Promise<BackupResult>
}

/**
 * Context shared across strategies and helpers.
 * All external dependencies are passed in here to keep strategies
 * instantiable without DI.
 */
export interface BackupContext {
  tempDir: string
  filename: string
  strategyType: 'full' | 'differential'
}
