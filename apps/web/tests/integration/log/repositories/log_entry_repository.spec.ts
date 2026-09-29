import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { UserFactory } from '#factories/identity/user_factory';
import LogEntry from '#log/models/log_entry';
import { LogEntryRepository } from '#log/repositories/log_entry_repository';
import { LogCategory, LogLevel, type CreateLogEntryInput } from '#log/types/logging';

test.group('LogEntryRepository', (group) => {
	const repo = new LogEntryRepository();

	group.each.setup(async () => {
		await LogEntry.query().delete();
	});

	const createEntry = (overrides: Partial<CreateLogEntryInput> = {}) =>
		repo.createRecord({
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			message: 'test entry',
			...overrides,
		});

	/**
	 * Backdate a row's `created_at` directly at the knex level — Lucid's
	 * `autoCreate` timestamp cannot be set through the model.
	 */
	const backdate = async (id: number, createdAt: DateTime) => {
		await db.from('log_entries').where('id', id).update({ created_at: createdAt.toSQL() });
	};

	test('createRecord persists all fields', async ({ assert }) => {
		const actor = await UserFactory.create();
		const entry = await createEntry({
			level: LogLevel.ERROR,
			category: LogCategory.BUSINESS,
			message: 'Business Event: page.published',
			actorId: actor.id,
			actorEmail: 'admin@example.com',
			ip: '127.0.0.1',
			userAgent: 'test-agent',
			requestId: 'req-123',
			context: { pageId: 42 },
			error: { name: 'Error', message: 'boom' },
		});

		const fresh = await LogEntry.findOrFail(entry.id);
		assert.equal(fresh.level, LogLevel.ERROR);
		assert.equal(fresh.category, LogCategory.BUSINESS);
		assert.equal(fresh.message, 'Business Event: page.published');
		assert.equal(fresh.actorId, actor.id);
		assert.equal(fresh.actorEmail, 'admin@example.com');
		assert.equal(fresh.ip, '127.0.0.1');
		assert.equal(fresh.userAgent, 'test-agent');
		assert.equal(fresh.requestId, 'req-123');
		assert.deepEqual(fresh.context, { pageId: 42 });
		assert.deepEqual(fresh.error, { name: 'Error', message: 'boom' });
		assert.isNotNull(fresh.createdAt);
	});

	test('createRecord defaults optional fields to null', async ({ assert }) => {
		const entry = await createEntry();

		assert.isNull(entry.actorId);
		assert.isNull(entry.actorEmail);
		assert.isNull(entry.ip);
		assert.isNull(entry.userAgent);
		assert.isNull(entry.requestId);
		assert.isNull(entry.context);
		assert.isNull(entry.error);
	});

	test('countOlderThan and deleteOlderThan prune by date', async ({ assert }) => {
		const marker = `prune_${Date.now()}`;
		const old = await createEntry({ message: `${marker} old` });
		const recent = await createEntry({ message: `${marker} recent` });
		await backdate(old.id, DateTime.now().minus({ days: 30 }));

		const cutoff = DateTime.now().minus({ days: 7 });

		const counted = await repo.countOlderThan(cutoff);
		assert.isTrue(counted >= 1);

		const deleted = await repo.deleteOlderThan(cutoff);
		assert.isTrue(deleted >= 1);

		assert.isNull(await LogEntry.find(old.id));
		assert.isNotNull(await LogEntry.find(recent.id));
	});

	test('countBeyondNewest and deleteOldestBeyond enforce a row cap', async ({ assert }) => {
		const marker = `cap_${Date.now()}`;
		const ids: number[] = [];
		for (let i = 0; i < 5; i++) {
			const entry = await createEntry({ message: `${marker} ${i}` });
			await backdate(entry.id, DateTime.now().minus({ hours: 5 - i }));
			ids.push(entry.id);
		}

		// 5 rows of this marker exist; other suites may add unrelated rows, so
		// only assert relative behavior below.
		const excess = await repo.countBeyondNewest(2);
		assert.isTrue(excess >= 3);

		await repo.deleteOldestBeyond(2);

		const remaining = await LogEntry.query().whereLike('message', `%${marker}%`);
		assert.lengthOf(remaining, 2);
		// The two newest entries of the marker set survive.
		assert.deepEqual(remaining.map((entry) => entry.id).sort(), [ids[3], ids[4]].sort());
	});
});
