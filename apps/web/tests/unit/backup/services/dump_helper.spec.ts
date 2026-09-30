import { test } from '@japa/runner';
import sinon from 'sinon';

/**
 * Unit tests for `DumpHelper` (createDatabaseDump).
 *
 * Passes a stubbed spawn function directly via the optional _spawn parameter
 * so no actual pg_dump binary is executed. We verify the generated command-line
 * arguments and error handling behaviour.
 */
test.group('DumpHelper', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	test('createDatabaseDump spawns pg_dump with correct base args', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};

		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().resolves();

		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				outputPath: '/tmp/dump.sql',
			},
			spawnStub,
			sanitizeStub,
		);

		assert.isTrue(spawnStub.calledOnce);
		const [cmd, args] = spawnStub.firstCall.args;
		assert.equal(cmd, 'pg_dump');
		assert.include(args, '-h');
		assert.include(args, 'localhost');
		assert.include(args, '-p');
		assert.include(args, '5432');
		assert.include(args, '-U');
		assert.include(args, 'postgres');
		assert.include(args, '-d');
		assert.include(args, 'mydb');
		assert.include(args, '-F');
		assert.include(args, 'p');
		assert.include(args, '-f');
		assert.include(args, '/tmp/dump.sql');
		assert.include(args, '--no-owner');
		assert.include(args, '--no-privileges');
	});

	test('createDatabaseDump appends -t flags for each table', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().resolves();

		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				outputPath: '/tmp/dump.sql',
				tables: ['users', 'posts'],
			},
			spawnStub,
			sanitizeStub,
		);

		const [, args] = spawnStub.firstCall.args;
		// Find -t flags and their following table names
		const tIdx1 = args.indexOf('-t');
		assert.equal(args[tIdx1 + 1], 'users');
		const tIdx2 = args.lastIndexOf('-t');
		assert.equal(args[tIdx2 + 1], 'posts');
	});

	test('createDatabaseDump passes PGPASSWORD in env', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().resolves();

		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'super-secret',
				outputPath: '/tmp/dump.sql',
			},
			spawnStub,
			sanitizeStub,
		);

		const [, , opts] = spawnStub.firstCall.args;
		assert.equal(opts.env.PGPASSWORD, 'super-secret');
	});

	test('createDatabaseDump rejects when pg_dump exits with non-zero code', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event, cb) => {
				if (event === 'close') cb(1); // exit code 1
				if (event === 'error') cb(new Error('spawn error'));
			}),
			stderr: {
				on: sinon.stub().callsFake((_event, cb) => {
					setTimeout(() => cb(Buffer.from('pg_dump: error')), 0);
				}),
			},
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		await assert.rejects(
			() =>
				createDatabaseDump(
					{
						host: 'localhost',
						port: 5432,
						user: 'postgres',
						database: 'mydb',
						password: 'secret',
						outputPath: '/tmp/dump.sql',
					},
					spawnStub,
				),
			/pg_dump|spawn error/,
		);
	});

	test('createDatabaseDump rejects on spawn error', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event, cb) => {
				if (event === 'error') cb(new Error('ENOENT: no such file'));
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		await assert.rejects(
			() =>
				createDatabaseDump(
					{
						host: 'localhost',
						port: 5432,
						user: 'postgres',
						database: 'mydb',
						password: 'secret',
						outputPath: '/tmp/dump.sql',
					},
					spawnStub,
				),
			/ENOENT/,
		);
	});

	test('createDatabaseDump sanitizes the dump file after success', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().resolves();

		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				outputPath: '/tmp/dump.sql',
			},
			spawnStub,
			sanitizeStub,
		);

		assert.isTrue(sanitizeStub.calledOnce);
		assert.equal(sanitizeStub.firstCall.args[0], '/tmp/dump.sql');
	});

	test('createDatabaseDump sanitizes the dump in place by default', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');
		const { mkdtemp, readFile, rm, writeFile } = await import('node:fs/promises');
		const { tmpdir } = await import('node:os');
		const { join } = await import('node:path');

		const dir = await mkdtemp(join(tmpdir(), 'dump-helper-'));
		const dumpPath = join(dir, 'dump.sql');
		await writeFile(dumpPath, ['COPY public.file_alts (id, alt) FROM stdin;', "1\tPage d'accueil", '\\.'].join('\n'));

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		// No _sanitize override — the real file-based sanitization must run
		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				outputPath: dumpPath,
			},
			spawnStub,
		);

		const contents = await readFile(dumpPath, 'utf8');
		assert.equal(contents, ['COPY public.file_alts (id, alt) FROM stdin;', '1\t"Page d\'accueil"', '\\.'].join('\n'));
		await rm(dir, { recursive: true, force: true });
	});

	test('createDatabaseDump skips sanitization when disabled', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().resolves();

		await createDatabaseDump(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				outputPath: '/tmp/dump.sql',
				sanitizeApostrophes: false,
			},
			spawnStub,
			sanitizeStub,
		);

		assert.isTrue(sanitizeStub.notCalled);
	});

	test('createDatabaseDump rejects when sanitization fails', async ({ assert }) => {
		const { createDatabaseDump } = await import('#backup/services/dump_helper');

		const mockProcess = {
			on: sinon.stub().callsFake((event: string, cb: (...args: any[]) => void) => {
				if (event === 'close') cb(0);
			}),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);
		const sanitizeStub = sinon.stub().rejects(new Error('ENOENT: no such file'));

		await assert.rejects(
			() =>
				createDatabaseDump(
					{
						host: 'localhost',
						port: 5432,
						user: 'postgres',
						database: 'mydb',
						password: 'secret',
						outputPath: '/tmp/dump.sql',
					},
					spawnStub,
					sanitizeStub,
				),
			/ENOENT/,
		);
	});

	test('sanitizeDumpForApostrophes wraps COPY fields containing a single quote', async ({ assert }) => {
		const { sanitizeDumpForApostrophes } = await import('#backup/services/dump_helper');

		const input = [
			'--',
			'COPY public.file_alts (id, language_code, alt) FROM stdin;',
			"1\tfr\tPage d'accueil du site",
			'2\ten\tPlain text',
			'3\tfr\tValue with \' and "quotes"',
			'4\tfr\tValue with "quotes"',
			'\\N\tfr\tNULL field',
			'\\restrict some-token',
			'\\.',
			'SET standard_conforming_strings = on;',
		].join('\n');

		const output = sanitizeDumpForApostrophes(input);

		const lines = output.split('\n');
		assert.equal(lines[2], '1\tfr\t"Page d\'accueil du site"');
		assert.equal(lines[3], '2\ten\tPlain text');
		assert.equal(lines[4], '3\tfr\t"Value with \' and ""quotes"""');
		assert.equal(lines[5], '4\tfr\tValue with "quotes"');
		assert.equal(lines[6], '\\N\tfr\tNULL field');
		assert.equal(lines[7], '\\restrict some-token');
		assert.equal(lines[8], '\\.');
		assert.equal(lines[9], 'SET standard_conforming_strings = on;');
	});
});
