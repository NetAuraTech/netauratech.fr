import logger from '@adonisjs/core/services/logger';
import ipaddr from 'ipaddr.js';
import { type CacheTier } from '#core/contracts/cache_driver';
import { CacheService } from '#shared/services/cache_service';
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
 * Cache key for the stored config within the `maintenance` namespace
 * (absolute key: `maintenance:config`) — unchanged from the pre-seam
 * Redis transport.
 */
const CONFIG_KEY = 'config';

/**
 * TTL for the stored config: 24h, refreshed on every read.
 */
const CONFIG_TTL_SECONDS = 86400;

/**
 * Maintenance Service - Single source of truth for maintenance mode configuration.
 *
 * Stores its config through the cache seam (the root `CacheService`:
 * composite failover driver with Redis as the primary tier and a
 * process-local in-memory tier as fallback, see ADR-012). Implements the
 * fallback lifecycle: initialize → explicit override → reconcile on primary
 * recovery.
 */
export class MaintenanceService {
	/**
	 * Namespaced view of the cache seam holding the stored config.
	 */
	private readonly configCache: CacheService;
	private memoryConfig: MemoryConfig = {
		enabled: false,
		message: '',
		allowedIps: [],
		retryAfter: 3600,
		updatedAt: new Date(),
		source: 'memory',
		_explicitlySet: false,
	};
	private cidrCache: CidrRange[] = [];
	private cidrCacheValid = false;

	/**
	 * @param cache - The root {@link CacheService} (composite failover
	 *   driver in production, see `start/container.ts`).
	 */
	constructor(cache: CacheService) {
		this.configCache = cache.namespace('maintenance');
	}

	/**
	 * Initialize memory fallback on application startup.
	 * Reads the stored config through the cache seam, otherwise initializes
	 * safe defaults. Logs a warning when the fallback tier is serving and no
	 * stored config exists, i.e. when safe defaults were actually used.
	 */
	async initializeMemoryFallback(): Promise<void> {
		const stored = await this.readStoredConfig();
		if (stored) {
			this.memoryConfig = {
				...stored,
				source: 'memory',
				_explicitlySet: false,
				_lastRedisSync: new Date(),
				updatedAt: new Date(),
			};
		} else {
			// No stored config on the serving tier - safe default: maintenance OFF
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

			if (this.cacheTier() === 'fallback') {
				logger.warn(
					{},
					'[MaintenanceService] Primary tier unavailable at startup. Memory fallback initialized with safe default (maintenance OFF).',
				);
			}
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
	 * Writes through the cache seam; when the composite driver is degraded
	 * to the fallback tier the change is flagged for reconciliation on
	 * recovery.
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
	 * Reports `memory` while the composite driver is serving operations from
	 * the process-local fallback tier.
	 */
	getSource(): 'redis' | 'memory' {
		return this.cacheTier() === 'fallback' ? 'memory' : 'redis';
	}

	/**
	 * Check if the primary tier (Redis in production) is currently available.
	 */
	isRedisAvailable(): boolean {
		return this.cacheTier() !== 'fallback';
	}

	/**
	 * Attempt to reconcile the in-process config with the primary tier on
	 * primary recovery.
	 *
	 * While the primary is down the read lands on the fallback tier and this
	 * is a no-op — there is nothing to reconcile against yet. Once the
	 * primary serves operations again: if the in-process config was
	 * explicitly modified during the outage it is pushed to the primary,
	 * otherwise the primary's value wins and is synced locally.
	 */
	async reconcileWithRedis(): Promise<void> {
		try {
			const stored = await this.readStoredConfig();

			// The read lands on the fallback tier while the primary is still
			// down - nothing to reconcile against yet.
			if (this.cacheTier() !== 'primary') {
				return;
			}

			if (!stored) {
				// No config on the primary - if memory was explicitly set, push to it
				if (this.memoryConfig._explicitlySet) {
					await this.writeStoredConfig(this.memoryConfig);
					logger.info({}, '[MaintenanceService] Reconciled: Pushed memory config to the primary tier.');
				}
				this.memoryConfig = { ...this.memoryConfig, _lastRedisSync: new Date() };
				return;
			}

			// Primary has a config - if memory was explicitly modified during an
			// outage, push it to the primary
			if (this.memoryConfig._explicitlySet && this.memoryConfig._lastRedisSync) {
				if (this.memoryConfig.updatedAt > this.memoryConfig._lastRedisSync) {
					await this.writeStoredConfig(this.memoryConfig);
					logger.info({}, '[MaintenanceService] Reconciled: Pushed modified memory config to the primary tier.');
				}
			}

			// Sync memory with the primary
			this.memoryConfig = {
				...stored,
				source: 'memory',
				_explicitlySet: false,
				_lastRedisSync: new Date(),
				updatedAt: new Date(),
			};
			this.updateCidrCache(stored.allowedIps);
			logger.info({}, '[MaintenanceService] Reconciled: Synced memory config from the primary tier.');
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

	/**
	 * The tier currently serving cache operations: `fallback` while the
	 * composite driver is degraded to the process-local tier, `primary`
	 * otherwise (single-tier drivers always serve directly).
	 */
	private cacheTier(): CacheTier {
		return this.configCache.tier === 'fallback' ? 'fallback' : 'primary';
	}

	/**
	 * Read the stored config from the cache seam, or `null` when no live
	 * value exists on the serving tier.
	 *
	 * Pre-seam payloads decode to the same JSON object the seam stores —
	 * the old transport single-encoded the payload with `JSON.stringify`,
	 * exactly like the seam's driver — so no legacy shape handling is
	 * needed.
	 */
	private async readStoredConfig(): Promise<MaintenanceConfig | null> {
		const raw = await this.configCache.get<MaintenanceConfig>(CONFIG_KEY);
		if (raw === null) {
			return null;
		}

		// Defensive fallback: ensure retryAfter is never undefined from stored state
		if (typeof raw.retryAfter !== 'number' || raw.retryAfter <= 0) {
			raw.retryAfter = this.getDefaultConfig().retryAfter;
		}

		// Refresh the TTL on read (24h), preserving the pre-seam behaviour.
		// A compare-and-set with the just-read value refreshes the TTL
		// without clobbering a concurrent write that happened in between.
		await this.configCache.compareAndSet(CONFIG_KEY, raw, raw, CONFIG_TTL_SECONDS);

		return raw;
	}

	/**
	 * Store the config through the cache seam with the 24h TTL. The payload
	 * is a single-encoded JSON object — the same on-wire shape the pre-seam
	 * transport wrote, so stored values are byte-compatible across the
	 * rollout.
	 */
	private async writeStoredConfig(config: MaintenanceConfig): Promise<void> {
		await this.configCache.set(
			CONFIG_KEY,
			{
				enabled: config.enabled,
				message: config.message,
				allowedIps: config.allowedIps,
				retryAfter: config.retryAfter,
				updatedAt: new Date().toISOString(),
				source: config.source,
				...(config.scheduled ? { scheduled: config.scheduled } : {}),
			},
			CONFIG_TTL_SECONDS,
		);
	}

	/**
	 * Persist config through the cache seam. The composite driver fails over
	 * per call, so a successful write may land on the process-local fallback
	 * tier while the primary is down — in that case the change is flagged
	 * `_explicitlySet` so {@link reconcileWithRedis} pushes it back to the
	 * primary on recovery.
	 */
	private async persistConfig(config: MaintenanceConfig): Promise<void> {
		await this.writeStoredConfig(config);

		if (this.cacheTier() === 'fallback') {
			// Fallback-tier write - mark as explicitly set by admin
			this.memoryConfig = {
				...config,
				source: 'memory',
				updatedAt: new Date(),
				_explicitlySet: true,
			};
		} else {
			this.memoryConfig = {
				...config,
				source: 'memory',
				_explicitlySet: false,
				_lastRedisSync: new Date(),
				updatedAt: new Date(),
			};
		}
		this.updateCidrCache(config.allowedIps);
	}

	/**
	 * Read the stored base config (primary tier, or the process-local
	 * fallback tier while the primary is down), without applying the
	 * scheduled window.
	 */
	private async readConfig(): Promise<MaintenanceConfig> {
		const stored = await this.readStoredConfig();
		if (stored) {
			return { ...stored, source: this.cacheTier() === 'fallback' ? 'memory' : 'redis' };
		}

		// No stored value on the serving tier - use the in-process copy
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
