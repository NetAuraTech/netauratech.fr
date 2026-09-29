import { BaseHttpException } from '#core/exceptions/base_http_exception';

/**
 * Raised when a TOTP code is missing, wrong, or outside the accepted time
 * window — either during enrollment confirmation or login verification.
 */
export default class InvalidTwoFactorCodeException extends BaseHttpException {
	static status = 401;
	static code = 'E_INVALID_TWO_FACTOR_CODE';

	constructor() {
		super('The authentication code is invalid or has expired.');
	}
}
