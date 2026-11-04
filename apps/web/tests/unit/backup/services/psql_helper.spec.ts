import { test } from '@japa/runner';
import sinon from 'sinon';

/**
 * Unit tests for `PsqlHelper`.
 *
 * `restoreDatabaseWithPsql` is tested with a stubbed `spawn` injected
 * through the function's second parameter.
 */
test.group('PsqlHelper', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	test('restoreDatabaseWithPsql spawns psql with ON_ERROR_STOP and single-transaction flags', async ({ assert }) => {
		const { restoreDatabaseWithPsql } = await import('#backup/services/psql_helper');

		const mockProcess = {
			on: sinon.stub().callsArgWith(1, 0),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		await restoreDatabaseWithPsql(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				sqlPath: '/tmp/backup.sql',
			},
			spawnStub,
		);

		assert.isTrue(spawnStub.calledOnce);
		const [cmd, args] = spawnStub.firstCall.args;
		assert.equal(cmd, 'psql');
		assert.include(args, '-v');
		assert.equal(args[args.indexOf('-v') + 1], 'ON_ERROR_STOP=1');
		assert.include(args, '-1');
		assert.include(args, '-h');
		assert.include(args, 'localhost');
		assert.include(args, '-p');
		assert.include(args, '5432');
		assert.include(args, '-U');
		assert.include(args, 'postgres');
		assert.include(args, '-d');
		assert.include(args, 'mydb');
		assert.include(args, '-f');
		assert.include(args, '/tmp/backup.sql');
	});

	test('restoreDatabaseWithPsql replays the prelude before the dump in the same transaction', async ({ assert }) => {
		const { restoreDatabaseWithPsql } = await import('#backup/services/psql_helper');

		const mockProcess = {
			on: sinon.stub().callsArgWith(1, 0),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		await restoreDatabaseWithPsql(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'secret',
				preludePath: '/tmp/prelude.sql',
				sqlPath: '/tmp/backup.sql',
			},
			spawnStub,
		);

		const [cmd, args] = spawnStub.firstCall.args;
		assert.equal(cmd, 'psql');
		assert.include(args, '-1');
		const preludeAt = args.indexOf('/tmp/prelude.sql');
		const dumpAt = args.indexOf('/tmp/backup.sql');
		assert.isTrue(preludeAt > -1);
		assert.isTrue(dumpAt > preludeAt);
		assert.equal(args[preludeAt - 1], '-f');
		assert.equal(args[dumpAt - 1], '-f');
	});

	test('restoreDatabaseWithPsql passes PGPASSWORD in env', async ({ assert }) => {
		const { restoreDatabaseWithPsql } = await import('#backup/services/psql_helper');

		const mockProcess = {
			on: sinon.stub().callsArgWith(1, 0),
			stderr: { on: sinon.stub() },
		};
		const spawnStub = sinon.stub().returns(mockProcess);

		await restoreDatabaseWithPsql(
			{
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				database: 'mydb',
				password: 'super-secret',
				sqlPath: '/tmp/backup.sql',
			},
			spawnStub,
		);

		const [, , opts] = spawnStub.firstCall.args;
		assert.equal(opts.env.PGPASSWORD, 'super-secret');
	});
});
