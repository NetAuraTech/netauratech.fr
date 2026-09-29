import { BaseHttpException } from '#core/exceptions/base_http_exception';

export default class SystemPermissionImmutableException extends BaseHttpException {
	static status = 409;
	static code = 'E_SYSTEM_PERMISSION_IMMUTABLE';

	constructor(protected slug: string) {
		super(`System permission "${slug}" cannot be modified or deleted.`);
	}

	protected details() {
		return { slug: this.slug };
	}

	protected i18nParams() {
		return { slug: this.slug };
	}
}
