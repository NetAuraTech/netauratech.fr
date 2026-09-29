import { test } from '@japa/runner';
import { withTransaction } from '#core/services/with_transaction';
import { UserFactory } from '#factories/identity/user_factory';
import LogEntry from '#log/models/log_entry';
import { LogService } from '#log/services/log_service';
import { LogCategory, LogLevel } from '#log/types/logging';

/**
 * Polls the database until a row matching `message` appears or the timeout
 * expires. The write-through path is fire-and-forget, so tests must wait
 * for the async insert to land.
 */
async function waitForEntry(message: string, timeoutMs = 3000): Promise<LogEntry | null> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const row = await LogEntry.query().where('message', message).first();
		if (row) return row;
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	return null;
}

test.group('LogService write-through', (group) => {
	const service = new LogService();

	group.each.setup(async () => {
		await LogEntry.query().delete();
	});

	test('logBusiness persists an attributable row', async ({ assert }) => {
		// The actor must be a real user row: `log_entries.actor_id` is FK-guarded.
		const actor = await UserFactory.create();
		const marker = `wt.business.${Date.now()}`;
		service.logBusiness(marker, { userId: actor.id }, { pageId: 42 });

		const row = await waitForEntry(`Business Event: ${marker}`);

		assert.isNotNull(row);
		assert.equal(row!.level, LogLevel.INFO);
		assert.equal(row!.category, LogCategory.BUSINESS);
		assert.equal(row!.actorId, actor.id);
		assert.deepEqual(row!.context, { userId: actor.id, pageId: 42 });
	});

	test('explicit top-level identity fields take precedence over context keys', async ({ assert }) => {
		const actor = await UserFactory.create();
		const marker = `wt.identity.${Date.now()}`;
		service.log({
			message: marker,
			level: LogLevel.INFO,
			category: LogCategory.BUSINESS,
			context: { userId: 1, ip: '10.0.0.9', requestId: 'legacy' },
			actorId: actor.id,
			actorEmail: 'admin@example.com',
			ip: '10.0.0.1',
			userAgent: 'test-agent',
			requestId: 'req-abc',
		});

		const row = await waitForEntry(marker);

		assert.isNotNull(row);
		assert.equal(row!.actorId, actor.id);
		assert.equal(row!.actorEmail, 'admin@example.com');
		assert.equal(row!.ip, '10.0.0.1');
		assert.equal(row!.userAgent, 'test-agent');
		assert.equal(row!.requestId, 'req-abc');
	});

	test('debug entries from noisy categories are not persisted', async ({ assert }) => {
		const gated = `wt.gated.${Date.now()}`;
		const control = `wt.control.${Date.now()}`;

		service.log({ message: gated, level: LogLevel.DEBUG, category: LogCategory.API });
		service.log({ message: control, level: LogLevel.INFO, category: LogCategory.API });

		// Wait for the control row — by the time it lands, the gated entry
		// would have been written too if it had passed the gate.
		assert.isNotNull(await waitForEntry(control));
		assert.isNull(await LogEntry.query().where('message', gated).first());
	});

	test('debug entries below the minimum level are not persisted', async ({ assert }) => {
		const gated = `wt.minlevel.${Date.now()}`;
		const control = `wt.minlevel.control.${Date.now()}`;

		service.log({ message: gated, level: LogLevel.DEBUG, category: LogCategory.SYSTEM });
		service.log({ message: control, level: LogLevel.INFO, category: LogCategory.SYSTEM });

		assert.isNotNull(await waitForEntry(control));
		assert.isNull(await LogEntry.query().where('message', gated).first());
	});

	test('security and business entries are always persisted, regardless of level', async ({ assert }) => {
		const securityMarker = `wt.security.${Date.now()}`;
		const businessMarker = `wt.business.debug.${Date.now()}`;

		service.log({ message: securityMarker, level: LogLevel.DEBUG, category: LogCategory.SECURITY });
		service.log({ message: businessMarker, level: LogLevel.DEBUG, category: LogCategory.BUSINESS });

		assert.isNotNull(await waitForEntry(securityMarker));
		assert.isNotNull(await waitForEntry(businessMarker));
	});

	test('entries emitted inside an ambient transaction are persisted after commit', async ({ assert }) => {
		const marker = `wt.in_trx.${Date.now()}`;

		await withTransaction(async () => {
			service.log({ message: marker, category: LogCategory.BUSINESS });
		});

		// The fire-and-forget insert resolves after the transaction commits, so it
		// must not use the ambient (by then dead) transaction client.
		const row = await waitForEntry(marker);

		assert.isNotNull(row);
		assert.equal(row!.message, marker);
	});
});
