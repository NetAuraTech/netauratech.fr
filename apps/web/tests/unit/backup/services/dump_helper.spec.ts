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
			on: sinon.stub(),
			stderr: { on: sinon.stub() },
		};
		// Simulate successful exit — on('close', cb) invokes callback with code 0
		mockProcess.on.callsArgWith(1, 0);

		const spawnStub = sinon.stub().returns(mockProcess);

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
			on: sinon.stub().callsArgWith(1, 0),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

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
			on: sinon.stub().callsArgWith(1, 0),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

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
});
