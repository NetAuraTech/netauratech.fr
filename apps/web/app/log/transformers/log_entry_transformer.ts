import { BaseTransformer } from '@adonisjs/core/transformers';
import type { LogEntry } from '#log/domain/log_entry';

/**
 * Maps a log {@link LogEntry} domain object to the API/Inertia audit-trail
 * payload.
 */
export default class LogEntryTransformer extends BaseTransformer<LogEntry> {
	/**
	 * Build the log entry payload.
	 *
	 * `id` is `null` for entries that have not been persisted yet.
	 */
	toObject() {
		return {
			id: this.resource.id?.value ?? null,
			level: this.resource.level,
			category: this.resource.category,
			message: this.resource.message,
			actorId: this.resource.actorId,
			actorEmail: this.resource.actorEmail,
			ip: this.resource.ip,
			userAgent: this.resource.userAgent,
			requestId: this.resource.requestId,
			context: this.resource.context,
			error: this.resource.error,
			createdAt: this.resource.createdAt,
		};
	}
}
