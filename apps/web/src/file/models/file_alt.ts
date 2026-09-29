import { belongsTo } from '@adonisjs/lucid/orm';
import { FileAltSchema } from '#database/schema';
import { FileAlt as FileAltDomain } from '#file/domain/file_alt';
import File from '#file/models/file';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class FileAlt extends FileAltSchema {
	@belongsTo(() => File, { foreignKey: 'fileId' })
	declare file: BelongsTo<typeof File>;

	/**
	 * Project this model onto its pure domain representation.
	 */
	toDomain(): FileAltDomain {
		return FileAltDomain.fromModel({
			locale: this.locale,
			key: this.key,
			value: this.value,
		});
	}
}
