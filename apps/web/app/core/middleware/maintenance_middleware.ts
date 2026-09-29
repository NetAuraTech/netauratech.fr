import MaintenanceException from '#core/exceptions/maintenance_exception';
import { MaintenanceService } from '#core/services/maintenance_service';
import { permissions } from '#start/permissions';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * Maintenance mode middleware - runs as a route group wrapper.
 * This middleware has access to route context via ctx.request.url()
 * and checks for maintenance mode with proper exemptions.
 */
export default class MaintenanceMiddleware {
	private readonly exemptPaths = [
		'/login', // GET/POST - Admin login during maintenance
		'/health', // Health check (liveness)
		'/health/ready', // Readiness probe
	];

	private readonly blockedAuthPaths = [
		'/register', // Registration disabled during maintenance
		'/forgot-password', // Password reset disabled
		'/reset-password', // Password reset disabled
		'/verify', // Email verification disabled
		'/accept-invitation', // Invitations disabled
		'/oauth/', // OAuth login disabled
	];

	async handle(ctx: HttpContext, next: NextFn) {
		const maintenanceService: MaintenanceService = await ctx.containerResolver.make(MaintenanceService);

		// 1. Fast IP allowlist check (pre-parsed CIDR cache, O(1))
		const clientIp = ctx.request.ip();
		if (maintenanceService.checkIpAllowed(clientIp)) {
			return next();
		}

		// 2. Check maintenance mode (Redis -> memory fallback, schedule folded in)
		const config = await maintenanceService.getEffectiveConfig();

		if (!config.enabled) {
			return next();
		}

		// 3. Maintenance is ON - check route exemptions
		const url = ctx.request.url();

		// Check exact path exemptions
		if (this.isExemptPath(url)) {
			return next();
		}

		// 4. Authenticated admin bypass — any user with admin.access skips maintenance
		const isAuthenticated = await ctx.auth.check();

		if (isAuthenticated) {
			const user = ctx.auth.user!;
			const hasAdminAccess = await user.checkAny([permissions.admin.access]);

			if (hasAdminAccess) {
				return next();
			}
		}

		// Check blocked auth routes (explicitly blocked even if they'd match other rules)
		if (this.isBlockedAuthRoute(url)) {
			throw new MaintenanceException(config.message, config.retryAfter);
		}

		// 5. No exemption - throw maintenance exception (exception handler will render response)
		throw new MaintenanceException(config.message, config.retryAfter);
	}

	private isExemptPath(url: string): boolean {
		return this.exemptPaths.includes(url);
	}

	private isBlockedAuthRoute(url: string): boolean {
		return this.blockedAuthPaths.some((path) => url.startsWith(path));
	}
}
