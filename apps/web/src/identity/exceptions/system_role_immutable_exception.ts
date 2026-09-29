import { BaseHttpException } from '#core/exceptions/base_http_exception';

export default class SystemRoleImmutableException extends BaseHttpException {
	static status = 409;
	static code = 'E_SYSTEM_ROLE_IMMUTABLE';

	constructor(protected slug: string) {
		super(`System role "${slug}" cannot be modified or deleted.`);
	}

	protected details() {
		return { slug: this.slug };
	}

	protected i18nParams() {
		return { slug: this.slug };
	}
}
