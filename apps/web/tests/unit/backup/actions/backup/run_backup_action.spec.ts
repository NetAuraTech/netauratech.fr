import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { RunBackupAction } from '#backup/actions/backup/run_backup_action';
import { BackupEngine } from '#backup/services/backup_engine';
import type { BackupResult } from '#backup/types/backup';

test.group('RunBackupAction', (group) => {
	group.each.teardown(() => {
		app.container.restore(BackupEngine);
	});

	test('execute() delegates to BackupEngine and returns its result', async ({ assert }) => {
		const mockResult: BackupResult = {
			success: true,
			filename: 'backup_full_20240101.zip',
			type: 'full',
			size: 1024,
			duration: 5000,
			storage: 'backups/backup_full_20240101.zip',
		};

		app.container.swap(
			BackupEngine,
			() =>
				({
					execute: () => Promise.resolve(mockResult),
				}) as unknown as BackupEngine,
		);

		const action = await app.container.make(RunBackupAction);
		const result = await action.execute({ strategy: 'full' });

		assert.strictEqual(result, mockResult);
	});

	test('execute() defaults to auto strategy when no payload is given', async ({ assert }) => {
		let resolvedStrategy: string | null = null;

		app.container.swap(BackupEngine, (_resolver, runtimeValues) => {
			resolvedStrategy = (runtimeValues ?? [])[0] ?? null;
			return {
				execute: () =>
					Promise.resolve({
						success: true,
						filename: 'backup.zip',
						type: 'full',
						size: 100,
						duration: 100,
						storage: 'backups/backup.zip',
					}),
			} as unknown as BackupEngine;
		});

		const action = await app.container.make(RunBackupAction);
		await action.execute();

		assert.strictEqual(resolvedStrategy, 'auto');
	});

	test('execute() passes the strategy type to BackupEngine', async ({ assert }) => {
		let resolvedStrategy: string | null = null;

		app.container.swap(BackupEngine, (_resolver, runtimeValues) => {
			resolvedStrategy = (runtimeValues ?? [])[0] ?? null;
			return {
				execute: () =>
					Promise.resolve({
						success: true,
						filename: 'backup.zip',
						type: 'differential',
						size: 50,
						duration: 200,
						storage: 'backups/backup.zip',
					}),
			} as unknown as BackupEngine;
		});

		const action = await app.container.make(RunBackupAction);
		await action.execute({ strategy: 'differential' });

		assert.strictEqual(resolvedStrategy, 'differential');
	});

	test('execute() propagates failure results from BackupEngine', async ({ assert }) => {
		const failureResult: BackupResult = {
			success: false,
			filename: '',
			type: 'full',
			size: 0,
			duration: 0,
			storage: '',
			error: 'Backup failed',
		};

		app.container.swap(
			BackupEngine,
			() =>
				({
					execute: () => Promise.resolve(failureResult),
				}) as unknown as BackupEngine,
		);

		const action = await app.container.make(RunBackupAction);
		const result = await action.execute({ strategy: 'full' });

		assert.strictEqual(result.success, false);
	});
});
