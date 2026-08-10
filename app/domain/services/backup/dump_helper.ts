import { spawn as defaultSpawn, type ChildProcess } from 'node:child_process'

export interface DumpOptions {
  host: string
  port: number
  user: string
  database: string
  password: string
  outputPath: string
  tables?: string[]
}

/**
 * Execute a pg_dump process for the given options.
 *
 * **Dependency injection for testability**
 *
 * The `_spawn` parameter is prefixed with `_` to signal it is an internal override.
 * In production, callers omit it and the real `node:child_process.spawn` is used.
 * In tests, pass a sinon stub to avoid spawning actual processes.
 *
 * @param options - pg_dump connection and output configuration.
 * @param _spawn - Optional spawn function for testability (defaults to node:child_process.spawn).
 */
export function createDatabaseDump(
  options: DumpOptions,
  _spawn: typeof defaultSpawn = defaultSpawn
): Promise<void> {
  const tables = options.tables ?? []

  return new Promise((resolve, reject) => {
    const args = [
      '-h',
      options.host,
      '-p',
      String(options.port),
      '-U',
      options.user,
      '-d',
      options.database,
      '-F',
      'p',
      '-f',
      options.outputPath,
    ]

    for (const table of tables) {
      args.push('-t', table)
    }

    const pgDump: ChildProcess = _spawn('pg_dump', args, {
      env: { ...process.env, PGPASSWORD: options.password },
    })

    let errorOutput = ''
    pgDump.stderr!.on('data', (data) => {
      errorOutput += data.toString()
    })

    pgDump.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
      }
    })

    pgDump.on('error', (error) => {
      reject(new Error(`Failed to start pg_dump: ${error.message}`))
    })
  })
}
