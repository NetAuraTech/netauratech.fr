import { type LucidModel } from '@adonisjs/lucid/types/model';
import { BaseHttpException } from '#core/exceptions/base_http_exception';

export default class RowNotFoundException extends BaseHttpException {
	static status = 404;
	static code = 'E_ROW_NOT_FOUND';

	constructor(protected model?: LucidModel) {
		super('The requested resource cannot be found.');
	}

	protected details() {
		return this.model ? { modelName: this.model.name } : {};
	}
}
