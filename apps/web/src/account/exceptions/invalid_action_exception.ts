import { BaseHttpException } from '#core/exceptions/base_http_exception';

/**
 * The `_action` discriminator of an account update request is not one of the
 * supported actions (`update_email`, `update_password`).
 */
export default class InvalidActionException extends BaseHttpException {
	static status = 400;
	static code = 'E_INVALID_ACTION';

	constructor() {
		super('Unknown account action (_action must be "update_email" or "update_password")');
	}
}
