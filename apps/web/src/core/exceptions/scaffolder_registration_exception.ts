/**
 * Thrown by the domain scaffolder when a composition file is missing a pinned
 * scaffold marker, so a `make:domain` run fails loudly with an explicit,
 * actionable error instead of silently leaving the new domain unregistered.
 *
 * Deliberately a plain `Error` rather than a `BaseHttpException`: the failure
 * is caught and logged by the `make:domain` ace command and never reaches the
 * HTTP exception handler.
 */
export default class ScaffolderRegistrationException extends Error {
	/**
	 * Create the exception.
	 *
	 * @param message - The actionable failure description (names the file and the missing marker line).
	 */
	constructor(message: string) {
		super(message);
		this.name = 'ScaffolderRegistrationException';
	}
}
