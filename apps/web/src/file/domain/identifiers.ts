import { Identifier } from '#core/domain/identifier';

/**
 * File-domain identifier types.
 *
 * Lucid models use numeric primary keys, so each identifier is a thin branded
 * wrapper around a number on the kernel {@link Identifier} base. They give
 * the pure domain objects a distinct, self-documenting identity type while
 * remaining trivially convertible back to the numeric key the persistence
 * layer and transformers use (`.value`).
 */

/** Identifier of a {@link File}. */
export class FileIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a file primary key as a {@link FileIdentifier}. */
	static of(value: number): FileIdentifier {
		return new FileIdentifier(value);
	}
}

/** Identifier of a {@link FileFolder}. */
export class FileFolderIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a folder primary key as a {@link FileFolderIdentifier}. */
	static of(value: number): FileFolderIdentifier {
		return new FileFolderIdentifier(value);
	}
}
