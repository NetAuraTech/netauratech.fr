import { spawn as defaultSpawn, type ChildProcess } from 'node:child_process';

export interface PsqlRestoreOptions {
	host: string;
	port: number;
	user: string;
	database: string;
	password: string;
	sqlPath: string;
}

/**
 * Restore a database by replaying a SQL dump through `psql`.
 *
 * **Flag hardening**
 *
 * `-v ON_ERROR_STOP=1` makes `psql` abort on the first failing statement, and
 * `-1` wraps the whole restore in a single transaction, so a failing restore
 * rolls back instead of partially applying the dump.
 *
 * **Dependency injection for testability**
 *
 * The `_spawn` parameter is prefixed with `_` to signal it is an internal override.
 * In production, callers omit it and the real `node:child_process.spawn` is used.
 * In tests, pass a sinon stub to avoid spawning actual processes.
 *
 * @param options - psql connection and dump-file configuration.
 * @param _spawn - Optional spawn function for testability (defaults to node:child_process.spawn).
 */
export function restoreDatabaseWithPsql(
	options: PsqlRestoreOptions,
	_spawn: typeof defaultSpawn = defaultSpawn,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const args = [
			'-v',
			'ON_ERROR_STOP=1',
			'-1',
			'-h',
			options.host,
			'-p',
			String(options.port),
			'-U',
			options.user,
			'-d',
			options.database,
			'-f',
			options.sqlPath,
		];

		const psql: ChildProcess = _spawn('psql', args, {
			env: { ...process.env, PGPASSWORD: options.password },
		});

		let errorOutput = '';
		psql.stderr!.on('data', (data) => {
			errorOutput += data.toString();
		});
		psql.on('close', (code) => {
			code === 0 ? resolve() : reject(new Error(`psql failed with code ${code}: ${errorOutput}`));
		});
		psql.on('error', (error) => {
			reject(new Error(`Failed to start psql: ${error.message}`));
		});
	});
}
