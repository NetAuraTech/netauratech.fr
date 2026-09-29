import app from '@adonisjs/core/services/app';
import drive from '@adonisjs/drive/services/main';
import { test } from '@japa/runner';
import sinon from 'sinon';
import { RestoreBackupAction } from '#backup/actions/backup/restore_backup_action';
import backupConfig from '#config/backup';

test.group('RestoreBackupAction', (group) => {
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

	group.each.setup(() => {
		drive.fake(backupConfig.storage.disk as any);
	});

	group.each.teardown(() => {
		drive.restore(backupConfig.storage.disk as any);
	});

	test('execute() returns failure when backup file not found', async ({ assert }) => {
		const action = await app.container.make(RestoreBackupAction);
		const result = await action.execute({ filename: 'non-existent-backup.sql.gz.enc' });

		assert.isFalse(result.success);
		assert.isDefined(result.error);
	});
});
