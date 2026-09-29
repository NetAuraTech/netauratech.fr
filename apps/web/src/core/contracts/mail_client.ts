/**
 * Envelope of a mail message as understood by the kernel mail service.
 *
 * The recipient, subject, and an edge template (plus its render data) are all
 * the kernel needs in order to delegate delivery to a {@link MailClientContract}.
 */
export interface MailClientMessage {
	/** Recipient address. */
	to: string;
	/** Email subject line. */
	subject: string;
	/** Edge template path used to render the HTML body. */
	template: string;
	/** Data passed to the template when rendering. */
	data?: Record<string, unknown>;
}

/**
 * Contract a mail client must satisfy.
 *
 * Declared as an abstract class (not an interface) so it can serve as an IoC
 * container token. The application binds this to a thin wrapper around the
 * framework mail driver (e.g. `@adonisjs/mail`), which keeps the kernel mail
 * service decoupled from any specific mail transport.
 */
export abstract class MailClientContract {
	/** Compose and send a single mail. */
	abstract send(message: MailClientMessage): Promise<void>;
}
