import { test } from '@japa/runner';
import { LogEntry } from '#log/domain/log_entry';
import { LogCategory, LogLevel } from '#log/types/logging';
import { lucidMeta, pinDrift, pinEnvelope, serializePayload } from '#tests/helpers/openapi_drift';
import { paginatedEnvelope } from '#transport/core/openapi/schemas';
import { logEntrySchema } from '#transport/log/rest/logs_resource';
import LogEntryTransformer from '#transport/log/transformers/log_entry_transformer';

const now = new Date('2026-01-15T10:00:00.000Z');

function makePersistedEntry(): LogEntry {
	return LogEntry.fromModel({
		id: 1,
		level: LogLevel.ERROR,
		category: LogCategory.AUTH,
		message: 'Login failed for user 1',
		actorId: 1,
		actorEmail: 'alice@example.com',
		ip: '127.0.0.1',
		userAgent: 'drift-test',
		requestId: 'req-123',
		context: { attempt: 3 },
		error: { name: 'AuthenticationException', message: 'Invalid credentials', stack: 'at login (auth.ts:1)' },
		createdAt: now,
	});
}

/** An entry going through the write pipeline: no id, actor, or timestamp yet. */
function makeUnpersistedEntry(): LogEntry {
	return LogEntry.fromRequest({
		message: 'boom',
		level: LogLevel.WARN,
		category: LogCategory.SYSTEM,
		context: { source: 'drift-test' },
		error: new Error('boom'),
	});
}

test.group('OpenAPI drift — log schemas', () => {
	test('persisted log entry payload is pinned to logEntrySchema', async () => {
		const payload = await serializePayload(new LogEntryTransformer(makePersistedEntry()).toObject());

		pinDrift(logEntrySchema, payload, 'logEntry');
	});

	test('unpersisted log entry payload (null id, actor and timestamp) is accepted', async () => {
		const payload = await serializePayload(new LogEntryTransformer(makeUnpersistedEntry()).toObject());

		pinDrift(logEntrySchema, payload, 'logEntry');
	});

	test('log list envelope conforms to the documented envelope', async () => {
		const payload = await serializePayload(new LogEntryTransformer(makePersistedEntry()).toObject());

		pinEnvelope(paginatedEnvelope(logEntrySchema), { data: [payload], metadata: lucidMeta() }, 'log list envelope');
	});

	test('a dropped documented field is rejected', async ({ assert }) => {
		const payload = await serializePayload(new LogEntryTransformer(makePersistedEntry()).toObject());
		delete payload.requestId;

		assert.throws(() => pinDrift(logEntrySchema, payload, 'logEntry'), /missing from payload: \[requestId\]/);
	});
});
