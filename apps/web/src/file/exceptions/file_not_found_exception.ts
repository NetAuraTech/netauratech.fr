import { BaseHttpException } from '#core/exceptions/base_http_exception';

export default class FileNotFoundException extends BaseHttpException {
	static status = 404;
	static code = 'E_FILE_NOT_FOUND';

	constructor(protected id: number) {
		super(`The file with id "${id}" cannot be found.`);
	}

	protected details() {
		return { id: this.id };
	}

	protected i18nParams() {
		return { id: this.id };
	}
}
