/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env';

export default await Env.create(new URL('../', import.meta.url), {
	/*
  |----------------------------------------------------------
  | Variables for configuring node
  |----------------------------------------------------------
  */
	NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
	PORT: Env.schema.number(),
	HOST: Env.schema.string({ format: 'host' }),
	LOG_LEVEL: Env.schema.string(),

	/*
  |----------------------------------------------------------
  | Variables for configuring app
  |----------------------------------------------------------
  */
	APP_KEY: Env.schema.secret(),
	APP_URL: Env.schema.string({ format: 'url', tld: false }),
	APP_NAME: Env.schema.string(),

	/*
  |----------------------------------------------------------
  | Variables for configuring session
  |----------------------------------------------------------
  */
	SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database', 'redis'] as const),

	/*
  |----------------------------------------------------------
  | Variables for configuring the auth guards
  |----------------------------------------------------------
  |
  | Which authentication mechanisms are active. full/inertia keep the
  | session guard and may opt into the token guard (REST API); the api
  | flavor disables the session guard entirely.
  |
  */
	AUTH_GUARD_WEB: Env.schema.boolean.optional(),
	AUTH_GUARD_API: Env.schema.boolean.optional(),
	AUTH_API_TOKEN_EXPIRY: Env.schema.string.optional(),
	AUTH_API_CLIENT_URL: Env.schema.string.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
	PG_HOST: Env.schema.string({ format: 'host' }),
	PG_PORT: Env.schema.number(),
	PG_USER: Env.schema.string(),
	PG_PASSWORD: Env.schema.secret(),
	PG_DB_NAME: Env.schema.string(),

	/*
  |--------------------------------------------------------------------------
  | Variables for configuring @adonisjs/redis package
  |--------------------------------------------------------------------------
  */
	REDIS_HOST: Env.schema.string({ format: 'host' }),
	REDIS_PORT: Env.schema.number(),
	REDIS_PASSWORD: Env.schema.string.optional(),
	REDIS_SOCKET: Env.schema.string.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring the queue package
  |----------------------------------------------------------
  */
	QUEUE_DRIVER: Env.schema.enum(['redis', 'sync'] as const),
	QUEUE_CONNECTION: Env.schema.enum(['main', 'local'] as const),
	QUEUE_CONCURRENCY: Env.schema.number.optional(),
	QUEUE_MAX_RETRIES: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring scheduled maintenance tasks
  |----------------------------------------------------------
  |
  | Each schedule is a duration string (e.g. "1d", "24h", "30m"); "0" disables
  | the task. The retention windows themselves are resolved in
  | config/maintenance.ts and config/logging.ts.
  |----------------------------------------------------------
  */
	MAINTENANCE_LOG_PRUNE_SCHEDULE: Env.schema.string.optional(),
	MAINTENANCE_BACKUP_RETENTION_SCHEDULE: Env.schema.string.optional(),
	LOG_RETENTION_DAYS: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
	MAIL_MAILER: Env.schema.enum(['smtp'] as const),
	MAIL_FROM_NAME: Env.schema.string(),
	MAIL_FROM_ADDRESS: Env.schema.string(),
	SMTP_HOST: Env.schema.string(),
	SMTP_PORT: Env.schema.number(),
	SMTP_USERNAME: Env.schema.string(),
	SMTP_PASSWORD: Env.schema.string(),

	/*
  |----------------------------------------------------------
  | Variables for configuring the Sentry SDK
  |----------------------------------------------------------
  */
	SENTRY_DSN: Env.schema.string(),

	/*
  |----------------------------------------------------------
  | Variables for Backup Configuration
  |----------------------------------------------------------
  */
	BACKUP_STORAGE_DISK: Env.schema.enum.optional(['fs', 's3', 'r2'] as const),
	BACKUP_TIME: Env.schema.string.optional(),
	BACKUP_ENCRYPTION_ENABLED: Env.schema.boolean.optional(),

	/*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Retention
  |----------------------------------------------------------
  */
	BACKUP_RETENTION_DAILY: Env.schema.number.optional(),
	BACKUP_RETENTION_WEEKLY: Env.schema.number.optional(),
	BACKUP_RETENTION_MONTHLY: Env.schema.number.optional(),
	BACKUP_RETENTION_YEARLY: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Health Check
  |----------------------------------------------------------
  */
	BACKUP_MAX_AGE_HOURS: Env.schema.number.optional(),
	BACKUP_MAX_SIZE_MB: Env.schema.number.optional(),
	BACKUP_MIN_FREE_SPACE_GB: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Notifications
  |----------------------------------------------------------
  */
	BACKUP_NOTIFICATION_EMAIL: Env.schema.string.optional(),
	BACKUP_NOTIFY_SUCCESS: Env.schema.boolean.optional(),
	BACKUP_NOTIFY_FAILURE: Env.schema.boolean.optional(),
	BACKUP_NOTIFY_HEALTH_CHECK: Env.schema.boolean.optional(),

	/*
  |----------------------------------------------------------
  | Variables for Backup Configuration: Differential
  |----------------------------------------------------------
  */
	BACKUP_EXCLUDED_TABLES: Env.schema.string.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
	DRIVE_DISK: Env.schema.enum(['fs', 's3', 'r2'] as const),
	AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
	AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
	AWS_REGION: Env.schema.string.optional(),
	S3_BUCKET: Env.schema.string.optional(),
	R2_KEY: Env.schema.string.optional(),
	R2_SECRET: Env.schema.string.optional(),
	R2_BUCKET: Env.schema.string.optional(),
	R2_ENDPOINT: Env.schema.string.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring file upload
  |----------------------------------------------------------
  */
	MAX_UPLOAD_SIZE: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
	LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),
	API_RATE_LIMIT_DEFAULT: Env.schema.number.optional(),

	/*
  |----------------------------------------------------------
  | Variables for sitemap.xml generation.
  | Comma-separated lists; both have safe defaults in config/sitemap.ts.
  |----------------------------------------------------------
  */
	SITEMAP_ADDITIONS: Env.schema.string.optional(),
	SITEMAP_EXCLUSIONS: Env.schema.string.optional(),
});
