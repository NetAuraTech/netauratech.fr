import redis from '@adonisjs/redis/services/main';
import { test } from '@japa/runner';
import { MaintenanceService } from '#core/services/maintenance_service';

/**
 * Helper to reset the MaintenanceService singleton between tests.
 * The class holds a private static `instance`; we clear it via bracket
 * notation so the next `getInstance()` call returns a fresh instance.
 */
function resetSingleton(): void {
	(MaintenanceService as any).instance = null;
}

test.group('MaintenanceService', (group) => {
	group.each.setup(async () => {
		await redis.flushdb();
		resetSingleton();
	});

	async function freshService(): Promise<MaintenanceService> {
		const service = MaintenanceService.getInstance();
		await service.initializeMemoryFallback();
		return service;
	}

	// ---------- Collar ----------

	test('isEnabled reports disabled state on fresh boot', async ({ assert }) => {
		const service = await freshService();

		assert.isFalse(await service.isEnabled());
	});

	test('getConfig returns default shape when nothing is stored', async ({ assert }) => {
		const service = await freshService();
		const config = await service.getConfig();

		assert.isFalse(config.enabled);
		assert.isString(config.message);
		assert.deepEqual(config.allowedIps, []);
		assert.isNumber(config.retryAfter);
		assert.isTrue(config.retryAfter > 0);
	});

	// ---------- setConfig / isEnabled / toggle ----------

	test('setConfig persists and reflects in getConfig', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({
			enabled: true,
			message: 'Site under maintenance',
			allowedIps: ['192.168.1.0/24'],
		});

		const config = await service.getConfig();
		assert.isTrue(config.enabled);
		assert.equal(config.message, 'Site under maintenance');
		assert.deepEqual(config.allowedIps, ['192.168.1.0/24']);
	});

	test('isEnabled reflects setConfig state', async ({ assert }) => {
		const service = await freshService();

		assert.isFalse(await service.isEnabled());

		await service.setConfig({ enabled: true });
		assert.isTrue(await service.isEnabled());

		await service.setConfig({ enabled: false });
		assert.isFalse(await service.isEnabled());
	});

	test('toggle enables when passing true', async ({ assert }) => {
		const service = await freshService();

		await service.toggle(true);
		assert.isTrue(await service.isEnabled());
	});

	test('toggle disables when passing false', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true });
		assert.isTrue(await service.isEnabled());

		await service.toggle(false);
		assert.isFalse(await service.isEnabled());
	});

	test('setConfig accepts a partial config', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true });
		assert.isTrue(await service.isEnabled());
	});

	// ---------- getRetryAfter ----------

	test('getRetryAfter returns the default retry-after window', async ({ assert }) => {
		const service = await freshService();

		assert.equal(service.getRetryAfter(), 3600);
	});

	// ---------- checkIpAllowed ----------

	test('checkIpAllowed returns false when no allowed IPs', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: [] });
		assert.isFalse(service.checkIpAllowed('192.168.1.1'));
	});

	test('checkIpAllowed matches an exact IPv4', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['10.0.0.1'] });
		assert.isTrue(service.checkIpAllowed('10.0.0.1'));
		assert.isFalse(service.checkIpAllowed('10.0.0.2'));
	});

	test('checkIpAllowed matches an IPv4 /24 CIDR range', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['192.168.1.0/24'] });
		assert.isTrue(service.checkIpAllowed('192.168.1.1'));
		assert.isTrue(service.checkIpAllowed('192.168.1.254'));
		assert.isFalse(service.checkIpAllowed('192.168.2.1'));
	});

	test('checkIpAllowed matches an IPv4 /8 CIDR range', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['10.0.0.0/8'] });
		assert.isTrue(service.checkIpAllowed('10.255.255.255'));
		assert.isTrue(service.checkIpAllowed('10.0.0.1'));
		assert.isFalse(service.checkIpAllowed('11.0.0.1'));
	});

	test('checkIpAllowed matches an IPv4 /32 CIDR range', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['203.0.113.5/32'] });
		assert.isTrue(service.checkIpAllowed('203.0.113.5'));
		assert.isFalse(service.checkIpAllowed('203.0.113.6'));
	});

	test('checkIpAllowed matches an exact IPv6', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['::1'] });
		assert.isTrue(service.checkIpAllowed('::1'));
		assert.isFalse(service.checkIpAllowed('2001:db8::1'));
	});

	test('checkIpAllowed matches an IPv6 /32 CIDR range', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['2001:db8::/32'] });
		assert.isTrue(service.checkIpAllowed('2001:db8::1'));
		assert.isTrue(service.checkIpAllowed('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
		assert.isFalse(service.checkIpAllowed('2002:db8::1'));
	});

	test('checkIpAllowed handles a mix of IPv4 and IPv6', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['10.0.0.1', '::1'] });
		assert.isTrue(service.checkIpAllowed('10.0.0.1'));
		assert.isTrue(service.checkIpAllowed('::1'));
		assert.isFalse(service.checkIpAllowed('192.168.1.1'));
	});

	test('checkIpAllowed matches multiple CIDR ranges', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['10.0.0.0/24', '172.16.0.0/16'] });
		assert.isTrue(service.checkIpAllowed('10.0.0.5'));
		assert.isTrue(service.checkIpAllowed('172.16.255.1'));
		assert.isFalse(service.checkIpAllowed('192.168.1.1'));
	});

	test('checkIpAllowed is case-insensitive for IPv6', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, allowedIps: ['2001:DB8::1'] });
		assert.isTrue(service.checkIpAllowed('2001:db8::1'));
	});

	// ---------- Redis availability ----------

	test('isRedisAvailable is true when Redis is up', async ({ assert }) => {
		const service = await freshService();

		assert.isTrue(service.isRedisAvailable());
	});

	// ---------- Memory fallback ----------

	test('initializeMemoryFallback initializes the memory config', async ({ assert }) => {
		const service = MaintenanceService.getInstance();

		await service.initializeMemoryFallback();

		const mem = service.getMemoryConfig();
		assert.isNotNull(mem);
		assert.isFalse(mem!.enabled);
	});

	// ---------- Redis persistence / reconciliation ----------

	test('config persists across singleton resets via Redis', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({
			enabled: true,
			message: 'Persistent message',
			allowedIps: ['10.0.0.0/8'],
		});

		resetSingleton();
		const restarted = await freshService();
		const config = await restarted.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'Persistent message');
		assert.deepEqual(config.allowedIps, ['10.0.0.0/8']);
	});

	test('reconcileWithRedis runs without error and keeps config', async ({ assert }) => {
		const service = await freshService();

		await service.setConfig({ enabled: true, message: 'reconcile' });

		await service.reconcileWithRedis();

		const config = await service.getConfig();
		assert.isTrue(config.enabled);
		assert.equal(config.message, 'reconcile');
	});

	// ---------- Scheduled maintenance window ----------

	test('isEnabled stays OFF before a scheduled window', async ({ assert }) => {
		const service = await freshService();
		const startAt = new Date(Date.now() + 60_000).toISOString();
		const endAt = new Date(Date.now() + 120_000).toISOString();

		await service.setConfig({ enabled: false, scheduled: { enabled: true, startAt, endAt } });

		assert.isFalse(await service.isEnabled());
	});

	test('isEnabled forces maintenance ON inside a scheduled window', async ({ assert }) => {
		const service = await freshService();
		const startAt = new Date(Date.now() - 60_000).toISOString();
		const endAt = new Date(Date.now() + 60_000).toISOString();

		await service.setConfig({ enabled: false, scheduled: { enabled: true, startAt, endAt } });

		assert.isTrue(await service.isEnabled());
	});

	test('retryAfter counts down to the end of an active window', async ({ assert }) => {
		const service = await freshService();
		const startAt = new Date(Date.now() - 60_000).toISOString();
		const endAt = new Date(Date.now() + 120_000).toISOString();

		await service.setConfig({ enabled: false, scheduled: { enabled: true, startAt, endAt } });

		const config = await service.getEffectiveConfig();
		assert.isTrue(config.enabled);
		assert.isTrue(config.retryAfter > 0 && config.retryAfter <= 120);
	});

	test('schedule auto-disables maintenance after the window ends', async ({ assert }) => {
		const service = await freshService();
		const startAt = new Date(Date.now() - 120_000).toISOString();
		const endAt = new Date(Date.now() - 60_000).toISOString();

		await service.setConfig({ enabled: false, scheduled: { enabled: true, startAt, endAt } });

		const config = await service.getConfig();
		assert.isFalse(config.enabled);
		assert.isFalse(config.scheduled?.enabled);
	});

	test('setSchedule(null) clears any existing schedule', async ({ assert }) => {
		const service = await freshService();
		const startAt = new Date(Date.now() - 60_000).toISOString();
		const endAt = new Date(Date.now() + 60_000).toISOString();

		await service.setConfig({ enabled: false, scheduled: { enabled: true, startAt, endAt } });
		await service.setSchedule(null);

		const config = await service.getConfig();
		assert.isUndefined(config.scheduled);
		assert.isFalse(config.enabled);
	});

	// ---------- Allowlist size limit (NFR §2.2) ----------

	test('setConfig rejects more than 100 allowed IPs', async ({ assert }) => {
		const service = await freshService();
		const tooMany = Array.from({ length: 101 }, (_, i) => `10.0.${i}.0/24`);

		await assert.rejects(() => service.setConfig({ allowedIps: tooMany }), RangeError);
	});

	test('setConfig accepts exactly 100 allowed IPs', async ({ assert }) => {
		const service = await freshService();
		const atLimit = Array.from({ length: 100 }, (_, i) => `10.0.${i}.0/24`);

		await service.setConfig({ allowedIps: atLimit });

		const config = await service.getConfig();
		assert.equal(config.allowedIps.length, 100);
	});
});
