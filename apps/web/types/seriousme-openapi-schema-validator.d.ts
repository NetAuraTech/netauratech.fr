declare module '@seriousme/openapi-schema-validator' {
	/** The outcome of validating one OpenAPI document. */
	export interface ValidationResult {
		/** Whether the document conforms to the version-specific schema. */
		valid: boolean;
		/** The validation errors, present only when the document is invalid. */
		errors?: unknown;
	}

	/**
	 * Validates OpenAPI documents (2.0, 3.0.x, 3.1.x, 3.2.x) against the
	 * official version-specific JSON schemas.
	 */
	export class Validator {
		constructor(options?: Record<string, unknown>);

		/**
		 * Validate an OpenAPI document: a parsed object, a JSON/YAML string,
		 * or a path to a local file.
		 */
		validate(data: unknown): Promise<ValidationResult>;
	}
}
