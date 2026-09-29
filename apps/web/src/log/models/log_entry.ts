import { belongsTo, column } from '@adonisjs/lucid/orm';
import { LogEntrySchema } from '#database/schema';
import User from '#identity/models/user';
import { LogEntry as LogEntryDomain } from '#log/domain/log_entry';
import type { LogCategory, LogLevel } from '#log/types/logging';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class LogEntry extends LogEntrySchema {
	@column()
	declare level: LogLevel;

	@column()
	declare category: LogCategory;

	@column()
	declare context: Record<string, any> | null;

	@column()
	declare error: { name: string; message: string; stack?: string } | null;

	@belongsTo(() => User, { foreignKey: 'actorId' })
	declare actor: BelongsTo<typeof User>;

	/**
	 * Project this model onto its pure domain representation. The actor
	 * identity fields and the error/context payload are carried by the domain
	 * object; the write path builds the same shape via
	 * `LogEntryDomain.fromRequest`.
	 */
	toDomain(): LogEntryDomain {
		return LogEntryDomain.fromModel({
			id: this.id,
			level: this.level,
			category: this.category,
			message: this.message,
			actorId: this.actorId,
			actorEmail: this.actorEmail,
			ip: this.ip,
			userAgent: this.userAgent,
			requestId: this.requestId,
			context: this.context,
			error: this.error,
			createdAt: this.createdAt?.toJSDate() ?? null,
		});
	}
}
