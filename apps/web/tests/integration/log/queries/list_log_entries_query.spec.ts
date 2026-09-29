import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { UserFactory } from '#factories/identity/user_factory';
import LogEntry from '#log/models/log_entry';
import { ListLogEntriesQuery } from '#log/queries/list_log_entries_query';
import { LogEntryRepository } from '#log/repositories/log_entry_repository';
import { LogCategory, LogLevel, type CreateLogEntryInput } from '#log/types/logging';

test.group('ListLogEntriesQuery', (group) => {
	const repo = new LogEntryRepository();
	const query = new ListLogEntriesQuery();

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

	test('returns entries newest first with pagination meta', async ({ assert }) => {
		const marker = `list_${Date.now()}`;
		const oldest = await createEntry({ message: `${marker} oldest` });
		const newest = await createEntry({ message: `${marker} newest` });
		await backdate(oldest.id, DateTime.now().minus({ hours: 2 }));

		const result = await query.execute({ search: marker, page: 1, perPage: 10 });

		assert.lengthOf(result.all(), 2);
		assert.equal(result.all()[0].id, newest.id);
		assert.equal(result.all()[1].id, oldest.id);
		assert.equal(result.getMeta().total, 2);
	});

	test('paginates results', async ({ assert }) => {
		const marker = `paginate_${Date.now()}`;
		for (let i = 0; i < 5; i++) {
			await createEntry({ message: `${marker} ${i}` });
		}

		const page1 = await query.execute({ search: marker, page: 1, perPage: 2 });
		const page3 = await query.execute({ search: marker, page: 3, perPage: 2 });

		assert.lengthOf(page1.all(), 2);
		assert.equal(page1.getMeta().total, 5);
		assert.equal(page1.getMeta().lastPage, 3);
		assert.lengthOf(page3.all(), 1);
	});

	test('filters by level and category', async ({ assert }) => {
		await createEntry({ level: LogLevel.ERROR, category: LogCategory.SECURITY });
		await createEntry({ level: LogLevel.INFO, category: LogCategory.BUSINESS });

		const errors = await query.execute({ level: LogLevel.ERROR });
		assert.isTrue(errors.all().length >= 1);
		assert.isTrue(errors.all().every((entry) => entry.level === LogLevel.ERROR));

		const business = await query.execute({ category: LogCategory.BUSINESS });
		assert.isTrue(business.all().length >= 1);
		assert.isTrue(business.all().every((entry) => entry.category === LogCategory.BUSINESS));
	});

	test('search is case-insensitive', async ({ assert }) => {
		const marker = `SearchMarker_${Date.now()}`;
		await createEntry({ message: `Business Event: ${marker}` });

		const result = await query.execute({ search: marker.toLowerCase() });

		assert.lengthOf(result.all(), 1);
		assert.include(result.all()[0].message, marker);
	});

	test('filters by actor and date range', async ({ assert }) => {
		const actor = await UserFactory.create();
		const recent = await createEntry({ actorId: actor.id });
		const old = await createEntry({ actorId: actor.id });
		await backdate(old.id, DateTime.now().minus({ days: 10 }));

		const byActor = await query.execute({ actorId: actor.id });
		assert.isTrue(byActor.all().length >= 2);

		const fromDate = await query.execute({
			actorId: actor.id,
			from: DateTime.now().minus({ days: 1 }),
		});
		assert.lengthOf(fromDate.all(), 1);
		assert.equal(fromDate.all()[0].id, recent.id);

		const toDate = await query.execute({
			actorId: actor.id,
			to: DateTime.now().minus({ days: 1 }),
		});
		assert.lengthOf(toDate.all(), 1);
		assert.equal(toDate.all()[0].id, old.id);
	});
});
