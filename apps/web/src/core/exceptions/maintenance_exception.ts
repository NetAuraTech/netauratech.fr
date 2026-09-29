import { Exception } from '@adonisjs/core/exceptions';

/**
 * Thrown by the maintenance middleware when a non-exempt request reaches the
 * application while maintenance mode is active. The HTTP rendering of the
 * 503 response (Inertia front page or JSON body) is a transport concern and
 * lives in the exception handler.
 */
export default class MaintenanceException extends Exception {
	static status = 503;
	static code = 'E_MAINTENANCE';

	constructor(
		message: string,
		public readonly retryAfter: number,
	) {
		super(message);
	}
}
