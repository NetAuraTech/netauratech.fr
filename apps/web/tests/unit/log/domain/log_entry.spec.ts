import { test } from '@japa/runner';
import { LogEntryIdentifier } from '#log/domain/identifiers';
import { LogEntry } from '#log/domain/log_entry';
import { LogCategory, LogLevel } from '#log/types/logging';

const model = (overrides: Partial<{ id: number; level: LogLevel; category: LogCategory; message: string }> = {}) => ({
	id: overrides.id ?? 1,
	level: overrides.level ?? LogLevel.INFO,
	category: overrides.category ?? LogCategory.SYSTEM,
	message: overrides.message ?? 'persisted',
	actorId: null,
	actorEmail: null,
	ip: null,
	userAgent: null,
	requestId: null,
	context: null,
	error: null,
});

/**
 * Unit tests for the {@link LogEntry} domain object — the actor-identity
 * resolution and the persistence shape of a log entry.
 */
test.group('LogEntry', () => {
	test('fromRequest() carries a null id before persistence', ({ assert }) => {
		const entry = LogEntry.fromRequest({ message: 'hello', level: LogLevel.INFO, category: LogCategory.SYSTEM });

		assert.isNull(entry.getIdentifier());
		assert.isNull(entry.id);
	});

	test('fromRequest() resolves actor identity from explicit fields', ({ assert }) => {
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			actorId: 7,
			actorEmail: 'actor@example.com',
			ip: '1.2.3.4',
			userAgent: 'ua',
			requestId: 'req-1',
		});

		assert.equal(entry.actorId, 7);
		assert.equal(entry.actorEmail, 'actor@example.com');
		assert.equal(entry.ip, '1.2.3.4');
		assert.equal(entry.userAgent, 'ua');
		assert.equal(entry.requestId, 'req-1');
	});

	test('fromRequest() falls back to the legacy context keys', ({ assert }) => {
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			context: { userId: 3, userEmail: 'ctx@example.com', ip: '5.6.7.8' },
		});

		assert.equal(entry.actorId, 3);
		assert.equal(entry.actorEmail, 'ctx@example.com');
		assert.equal(entry.ip, '5.6.7.8');
	});

	test('fromRequest() lets explicit fields take precedence over context keys', ({ assert }) => {
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			actorId: 7,
			context: { userId: 3 },
		});

		assert.equal(entry.actorId, 7);
	});

	test('fromRequest() merges metadata into the context', ({ assert }) => {
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			context: { key: 'from-context' },
			metadata: { extra: 'from-metadata' },
		});

		assert.deepEqual(entry.context, { key: 'from-context', extra: 'from-metadata' });
	});

	test('fromRequest() serialises the Error instance', ({ assert }) => {
		const error = new Error('boom');
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.ERROR,
			category: LogCategory.SYSTEM,
			error,
		});

		assert.deepEqual(entry.error, { name: 'Error', message: 'boom', stack: error.stack });
	});

	test('toRecord() produces the persistence row', ({ assert }) => {
		const entry = LogEntry.fromRequest({
			message: 'hello',
			level: LogLevel.WARN,
			category: LogCategory.BUSINESS,
		});

		assert.deepEqual(entry.toRecord(), {
			level: LogLevel.WARN,
			category: LogCategory.BUSINESS,
			message: 'hello',
			actorId: null,
			actorEmail: null,
			ip: null,
			userAgent: null,
			requestId: null,
			context: {},
			error: null,
		});
	});

	test('fromModel() hydrates the identity through a LogEntryIdentifier', ({ assert }) => {
		const entry = LogEntry.fromModel(model({ id: 11 }));

		assert.isTrue(entry.id instanceof LogEntryIdentifier);
		assert.equal(entry.id!.value, 11);
		assert.deepEqual(entry.context, {});
	});

	test('equals() compares identities, and rejects null identities', ({ assert }) => {
		const a = LogEntry.fromModel(model({ id: 1 }));
		const b = LogEntry.fromModel(
			model({ id: 1, level: LogLevel.ERROR, category: LogCategory.BUSINESS, message: 'other' }),
		);
		const c = LogEntry.fromModel(model({ id: 2 }));
		const unpersisted = LogEntry.fromRequest({ message: 'x', level: LogLevel.INFO, category: LogCategory.SYSTEM });

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
		assert.isFalse(a.equals(unpersisted));
	});
});
