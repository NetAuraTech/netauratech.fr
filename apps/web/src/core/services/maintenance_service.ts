import logger from '@adonisjs/core/services/logger';
import redis from '@adonisjs/redis/services/main';
import ipaddr from 'ipaddr.js';
import type { MaintenanceConfig, MaintenanceSchedule, MemoryConfig } from '#core/types/maintenance';
import type { IPv4, IPv6 } from 'ipaddr.js';

/**
 * CIDR range for IP matching
 */
interface CidrRange {
	addr: IPv4 | IPv6;
	bits: number;
}

/**
 * Maximum number of CIDR entries allowed in the IP allowlist (NFR §2.2).
 */
export const MAX_ALLOWED_IPS = 100;

/**
 * Maintenance Service - Single source of truth for maintenance mode configuration.
 *
 * Uses Redis as primary source of truth with in-memory fallback when Redis is unavailable.
 * Implements fallback lifecycle: initialize → explicit override → reconcile on Redis recovery.
 */
export class MaintenanceService {
	private static instance: MaintenanceService;
	private memoryConfig: MemoryConfig = {
		enabled: false,
		message: '',
		allowedIps: [],
		retryAfter: 3600,
		updatedAt: new Date(),
		source: 'memory',
		_explicitlySet: false,
	};
	private redisAvailable = true;
	private cidrCache: CidrRange[] = [];
	private cidrCacheValid = false;

	constructor() {}

	static getInstance(): MaintenanceService {
		if (!MaintenanceService.instance) {
			MaintenanceService.instance = new MaintenanceService();
		}
		return MaintenanceService.instance;
	}

	/**
	 * Initialize memory fallback on application startup.
	 * Reads from Redis if available, otherwise initializes safe defaults.
	 */
	async initializeMemoryFallback(): Promise<void> {
		try {
			const config = await this.readFromRedis();
			if (config) {
				this.memoryConfig = {
					...config,
					source: 'memory',
					_explicitlySet: false,
					_lastRedisSync: new Date(),
					updatedAt: new Date(),
				};
				this.redisAvailable = true;
			} else {
				// No Redis config exists - safe default: maintenance OFF
				this.memoryConfig = {
					enabled: false,
					message: '',
					allowedIps: [],
					retryAfter: 3600,
					updatedAt: new Date(),
					source: 'memory',
					_explicitlySet: false,
					_lastRedisSync: new Date(),
				};
				this.redisAvailable = true;
			}
		} catch (error) {
			// Redis unavailable - start with safe default (maintenance OFF)
			this.memoryConfig = {
				enabled: false,
				message: '',
				allowedIps: [],
				retryAfter: 3600,
				updatedAt: new Date(),
				source: 'memory',
				_explicitlySet: false,
				_lastRedisSync: new Date(),
			};
			this.redisAvailable = false;
			logger.warn(
				{ error },
				'[MaintenanceService] Redis unavailable at startup. Memory fallback initialized with safe default (maintenance OFF).',
			);
		}
	}

	/**
	 * Check if maintenance mode is currently enabled.
	 * Takes scheduled maintenance windows into account: maintenance is
	 * active when the base toggle is on, or when an armed schedule window is
	 * currently in effect.
	 */
	async isEnabled(): Promise<boolean> {
		const config = await this.getEffectiveConfig();
		return config.enabled;
	}

	/**
	 * Get the base maintenance configuration.
	 * The `enabled` flag is the admin toggle only — scheduled windows are NOT
	 * folded in. Includes lazy auto-disable of expired schedules.
	 * Used by the admin UI, CLI commands, and `setConfig`.
	 */
	async getConfig(): Promise<MaintenanceConfig> {
		const config = await this.readConfig();
		this.updateCidrCache(config.allowedIps);
		return this.autoDisableSchedule(config);
	}

	/**
	 * Get the effective maintenance configuration.
	 * `enabled` reflects the real runtime state: the base toggle OR an active
	 * scheduled window. When a window is active, `retryAfter` counts down to
	 * its end. Used by the middleware and status reporting.
	 */
	async getEffectiveConfig(): Promise<MaintenanceConfig> {
		const config = await this.getConfig();
		return this.foldSchedule(config);
	}

	/**
	 * Update maintenance configuration.
	 * Writes to Redis if available, otherwise to memory with explicit flag.
	 */
	async setConfig(config: Partial<MaintenanceConfig>): Promise<void> {
		if (config.allowedIps && config.allowedIps.length > MAX_ALLOWED_IPS) {
			throw new RangeError(`Maintenance allowlist allows a maximum of ${MAX_ALLOWED_IPS} CIDR entries`);
		}

		const current = await this.getConfig();
		const updated: MaintenanceConfig = {
			...current,
			...config,
			retryAfter: config.retryAfter ?? current.retryAfter,
		};

		await this.persistConfig(updated);
	}

	/**
	 * Configure a scheduled maintenance window.
	 * Pass `null` to clear any existing schedule.
	 */
	async setSchedule(schedule: MaintenanceSchedule | null): Promise<void> {
		await this.setConfig({ scheduled: schedule ?? undefined });
	}

	/**
	 * Toggle maintenance mode on/off.
	 */
	async toggle(enabled: boolean, message?: string, allowedIps?: string[]): Promise<void> {
		const config = await this.getConfig();

		await this.setConfig({
			enabled,
			message: message ?? config.message,
			allowedIps: allowedIps ?? config.allowedIps,
		});
	}

	/**
	 * Check if an IP address is in the allowlist.
	 * Supports CIDR notation (IPv4 and IPv6), bare IPs default to /32 or /128.
	 */
	checkIpAllowed(ip: string): boolean {
		if (!this.cidrCacheValid || this.cidrCache.length === 0) {
			return false;
		}

		let addr: IPv4 | IPv6;
		try {
			addr = ipaddr.process(ip);
		} catch {
			return false;
		}

		// Normalize IPv4-mapped IPv6 addresses (::ffff:1.2.3.4 -> 1.2.3.4)
		if (addr.kind() === 'ipv6' && (addr as IPv6).isIPv4MappedAddress()) {
			addr = (addr as IPv6).toIPv4Address();
		}

		for (const range of this.cidrCache) {
			if (range.addr.kind() !== addr.kind()) {
				continue;
			}
			try {
				if (addr.match(range.addr, range.bits)) {
					return true;
				}
			} catch {
				// Skip malformed range and keep matching the rest
			}
		}
		return false;
	}

	/**
	 * Get retry-after value in seconds.
	 */
	getRetryAfter(): number {
		return 3600; // Default 1 hour
	}

	/**
	 * Get current configuration source (for admin UI / CLI status).
	 */
	getSource(): 'redis' | 'memory' {
		return this.redisAvailable ? 'redis' : 'memory';
	}

	/**
	 * Check if Redis is currently available.
	 */
	isRedisAvailable(): boolean {
		return this.redisAvailable;
	}

	/**
	 * Attempt to reconcile memory config with Redis on Redis recovery.
	 * Called when Redis becomes available again.
	 */
	async reconcileWithRedis(): Promise<void> {
		if (!this.redisAvailable) {
			try {
				await this.testRedisConnection();
				this.redisAvailable = true;
			} catch {
				return; // Still unavailable
			}
		}

		try {
			const redisConfig = await this.readFromRedis();
			if (!redisConfig) {
				// No Redis config exists - if memory was explicitly set, push to Redis
				if (this.memoryConfig._explicitlySet) {
					await this.writeToRedis({
						enabled: this.memoryConfig.enabled,
						message: this.memoryConfig.message,
						allowedIps: this.memoryConfig.allowedIps,
						retryAfter: this.memoryConfig.retryAfter,
						source: 'memory',
						scheduled: this.memoryConfig.scheduled,
					});
					logger.info({}, '[MaintenanceService] Reconciled: Pushed memory config to Redis.');
				}
				this.memoryConfig._lastRedisSync = new Date();
				return;
			}

			// Redis has config - if memory was explicitly modified during outage, push to Redis
			if (this.memoryConfig._explicitlySet && this.memoryConfig._lastRedisSync) {
				if (this.memoryConfig.updatedAt > this.memoryConfig._lastRedisSync) {
					await this.writeToRedis({
						enabled: this.memoryConfig.enabled,
						message: this.memoryConfig.message,
						allowedIps: this.memoryConfig.allowedIps,
						retryAfter: this.memoryConfig.retryAfter,
						source: 'memory',
						scheduled: this.memoryConfig.scheduled,
					});
					logger.info({}, '[MaintenanceService] Reconciled: Pushed modified memory config to Redis.');
				}
			}

			// Sync memory with Redis
			this.memoryConfig = {
				...redisConfig,
				source: 'memory',
				_explicitlySet: false,
				_lastRedisSync: new Date(),
				updatedAt: new Date(),
			};
			this.updateCidrCache(redisConfig.allowedIps);
			logger.info({}, '[MaintenanceService] Reconciled: Synced memory config from Redis.');
		} catch (error) {
			logger.warn({ error }, '[MaintenanceService] Reconciliation failed.');
		}
	}

	/**
	 * Get raw memory config (for debugging/admin).
	 */
	getMemoryConfig(): MemoryConfig | null {
		return { ...this.memoryConfig };
	}

	// ─── Private Methods ────────────────────────────────────────────────

	private getDefaultConfig(): MaintenanceConfig {
		return {
			enabled: false,
			message: '',
			allowedIps: [],
			retryAfter: 3600,
			source: 'memory',
		};
	}

	private async readFromRedis(): Promise<MaintenanceConfig | null> {
		const key = 'maintenance:config';
		const raw = await redis.get(key);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw) as Partial<MaintenanceConfig>;
			// Defensive fallback: ensure retryAfter is never undefined from stored Redis state
			if (typeof parsed.retryAfter !== 'number' || parsed.retryAfter <= 0) {
				parsed.retryAfter = this.getDefaultConfig().retryAfter;
			}
			// Refresh TTL on read (24h)
			await redis.expire(key, 86400);
			return parsed as MaintenanceConfig;
		} catch {
			return null;
		}
	}

	private async writeToRedis(config: MaintenanceConfig): Promise<void> {
		const key = 'maintenance:config';
		const payload = JSON.stringify({
			enabled: config.enabled,
			message: config.message,
			allowedIps: config.allowedIps,
			retryAfter: config.retryAfter,
			updatedAt: new Date().toISOString(),
			source: config.source,
			...(config.scheduled ? { scheduled: config.scheduled } : {}),
		});
		await redis.set(key, payload, 'EX', 86400); // 24h TTL
	}

	/**
	 * Persist config to Redis (source of truth) or to memory with the explicit
	 * flag when Redis is unavailable. Used by `setConfig` and the lazy schedule
	 * auto-disable.
	 */
	private async persistConfig(config: MaintenanceConfig): Promise<void> {
		if (this.redisAvailable) {
			try {
				await this.writeToRedis(config);
				this.memoryConfig = {
					...config,
					source: 'memory',
					_explicitlySet: false,
					_lastRedisSync: new Date(),
					updatedAt: new Date(),
				};
				this.updateCidrCache(config.allowedIps);
				return;
			} catch (error) {
				this.redisAvailable = false;
				logger.warn({ error }, '[MaintenanceService] Redis write failed, falling back to memory.');
			}
		}

		// Memory fallback - mark as explicitly set by admin
		this.memoryConfig = {
			...config,
			source: 'memory',
			updatedAt: new Date(),
			_explicitlySet: true,
		};
		this.updateCidrCache(config.allowedIps);
	}

	/**
	 * Read the stored base config (Redis source of truth or memory fallback),
	 * without applying the scheduled window.
	 */
	private async readConfig(): Promise<MaintenanceConfig> {
		if (this.redisAvailable) {
			try {
				const redisConfig = await this.readFromRedis();
				if (redisConfig) {
					return { ...redisConfig, source: 'redis' };
				}
			} catch (error) {
				this.redisAvailable = false;
				logger.warn({ error }, '[MaintenanceService] Redis read failed, falling back to memory.');
			}
		}

		// Memory fallback
		return {
			enabled: this.memoryConfig.enabled,
			message: this.memoryConfig.message,
			allowedIps: this.memoryConfig.allowedIps,
			retryAfter: this.memoryConfig.retryAfter,
			source: 'memory',
			scheduled: this.memoryConfig.scheduled,
		};
	}

	/**
	 * Lazily disarm a scheduled maintenance window once its end has
	 * passed. Persists the change so it only runs once. Does not touch the base
	 * `enabled` toggle.
	 */
	private async autoDisableSchedule(config: MaintenanceConfig): Promise<MaintenanceConfig> {
		const scheduled = config.scheduled;
		if (!scheduled || !scheduled.enabled) {
			return config;
		}

		const endAt = new Date(scheduled.endAt).getTime();
		if (Number.isNaN(endAt) || Date.now() <= endAt) {
			return config;
		}

		const cleared: MaintenanceConfig = {
			...config,
			scheduled: { ...scheduled, enabled: false },
		};
		await this.persistConfig(cleared);
		return cleared;
	}

	/**
	 * Fold an armed scheduled window into the effective state.
	 *
	 * - Before the window: maintenance stays off.
	 * - Inside the window: maintenance is forced ON and `retryAfter` counts down
	 *   to the end of the window.
	 * - After the window: `autoDisableSchedule` already disarmed it.
	 */
	private foldSchedule(config: MaintenanceConfig): MaintenanceConfig {
		const scheduled = config.scheduled;
		if (!scheduled || !scheduled.enabled) {
			return config;
		}

		const startAt = new Date(scheduled.startAt).getTime();
		const endAt = new Date(scheduled.endAt).getTime();
		if (Number.isNaN(startAt) || Number.isNaN(endAt)) {
			return config;
		}

		const now = Date.now();
		if (now < startAt) {
			return config;
		}

		const retryAfter = Math.max(1, Math.ceil((endAt - now) / 1000));
		return { ...config, enabled: true, retryAfter };
	}

	private async testRedisConnection(): Promise<void> {
		await redis.ping();
	}

	private updateCidrCache(cidrStrings: string[]): void {
		this.cidrCache = cidrStrings.map((cidr) => this.parseCidr(cidr)).filter((r): r is CidrRange => r !== null);
		this.cidrCacheValid = true;
	}

	private parseCidr(cidr: string): CidrRange | null {
		// Bare IPs default to /32 (IPv4) or /128 (IPv6)
		const normalized = cidr.includes('/') ? cidr : `${cidr}/${cidr.includes(':') ? 128 : 32}`;

		try {
			const [addr, bits] = ipaddr.parseCIDR(normalized);
			return { addr, bits };
		} catch {
			return null;
		}
	}
}
