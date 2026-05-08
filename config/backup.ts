import env from '#start/env'

/**
 * Configuration for the backup system
 *
 * Storage is handled by @adonisjs/drive — the same driver used for
 * CMS file uploads. Backup files are stored under the `backup/` prefix
 * on the configured disk.
 *
 * Backup strategy:
 * - Full backup: Weekly (Sunday)
 * - Differential backup: Daily (Monday-Saturday)
 *
 * Rotation policy (Spatie-like):
 * - Daily: Keep 7 last days
 * - Weekly: Keep 4 last weeks (Sunday)
 * - Monthly: Keep 3 last months (1st of month)
 * - Yearly: Keep 1 per year (1st January) - optional
 */
const backupConfig = {
  /**
   * Database connection to backup
   */
  database: {
    connection: env.get('DB_CONNECTION', 'pg'),
  },

  /**
   * Storage configuration — uses @adonisjs/drive.
   * The disk must match one of the keys in config/drive.ts (fs, s3, r2).
   * All backup files are stored under the `backup/` prefix.
   */
  storage: {
    disk: env.get('BACKUP_STORAGE_DISK', 'fs') as 'fs' | 's3' | 'r2',
    prefix: 'backup',
  },

  /**
   * Backup schedule configuration
   */
  schedule: {
    /**
     * Full backup day (0 = Sunday, 6 = Saturday)
     */
    fullBackupDay: 0, // Sunday

    /**
     * Backup time (24h format)
     */
    time: env.get('BACKUP_TIME', '02:00'),
  },

  /**
   * Encryption configuration
   */
  encryption: {
    /**
     * Enable encryption
     */
    enabled: env.get('BACKUP_ENCRYPTION_ENABLED', true),

    /**
     * Encryption key (uses APP_KEY by default)
     */
    key: env.get('APP_KEY'),

    /**
     * Encryption algorithm
     */
    algorithm: 'aes-256-cbc',
  },

  /**
   * Compression configuration
   */
  compression: {
    /**
     * Enable gzip compression
     */
    enabled: true,

    /**
     * Compression level (1-9, 9 = max compression)
     */
    level: 6,
  },

  /**
   * Rotation policy (Spatie-like)
   */
  retention: {
    /**
     * Keep backups for X days
     */
    daily: env.get('BACKUP_RETENTION_DAILY', 7),

    /**
     * Keep weekly backups for X weeks (Sunday backups)
     */
    weekly: env.get('BACKUP_RETENTION_WEEKLY', 4),

    /**
     * Keep monthly backups for X months (1st of month)
     */
    monthly: env.get('BACKUP_RETENTION_MONTHLY', 3),

    /**
     * Keep yearly backups for X years (1st January)
     */
    yearly: env.get('BACKUP_RETENTION_YEARLY', 1),
  },

  /**
   * Health check configuration
   */
  health: {
    /**
     * Maximum age of last backup (in hours)
     * Alert if no backup in X hours
     */
    maxBackupAge: env.get('BACKUP_MAX_AGE_HOURS', 25), // 25h = 1 day + margin

    /**
     * Maximum backup size to alert (in MB)
     */
    maxBackupSize: env.get('BACKUP_MAX_SIZE_MB', 500),

    /**
     * Minimum free disk space (in GB) — only checked for local (fs) disk
     */
    minFreeSpace: env.get('BACKUP_MIN_FREE_SPACE_GB', 5),
  },

  /**
   * Notification configuration
   */
  notifications: {
    /**
     * Email to send alerts
     */
    email: env.get('BACKUP_NOTIFICATION_EMAIL', env.get('MAIL_FROM_ADDRESS')),

    /**
     * Send notification on success
     */
    onSuccess: env.get('BACKUP_NOTIFY_SUCCESS', false),

    /**
     * Send notification on failure
     */
    onFailure: env.get('BACKUP_NOTIFY_FAILURE', true),

    /**
     * Send notification on health check failure
     */
    onHealthCheckFailure: env.get('BACKUP_NOTIFY_HEALTH_CHECK', true),
  },

  /**
   * Differential backup configuration
   */
  differential: {
    /**
     * Enable differential backups
     */
    enabled: true,

    /**
     * Tables to exclude from differential backups
     * (always backed up in full backups)
     */
    excludedTables: env.get('BACKUP_EXCLUDED_TABLES', '').split(',').filter(Boolean),
  },
}

export default backupConfig
