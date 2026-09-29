import { BaseHttpException } from '#core/exceptions/base_http_exception';

export default class ApiClientUrlMissingException extends BaseHttpException {
	static status = 500;
	static code = 'E_API_CLIENT_URL_MISSING';

	constructor() {
		super('AUTH_API_CLIENT_URL is not configured but is required for OAuth API mode.');
	}
}
