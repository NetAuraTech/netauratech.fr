import factory from '@adonisjs/lucid/factories';
import LogEntry from '#log/models/log_entry';
import { LogCategory, LogLevel } from '#log/types/logging';

export const LogEntryFactory = factory
	.define(LogEntry, async ({ faker }) => {
		return {
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			message: faker.lorem.sentence(),
			actorId: null,
			actorEmail: null,
			ip: null,
			userAgent: null,
			requestId: null,
			context: null,
			error: null,
		};
	})
	.build();
