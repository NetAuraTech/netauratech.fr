import app from '@adonisjs/core/services/app';
import { MailClientContract, type MailClientMessage } from '#core/contracts/mail_client';

/**
 * In-memory {@link MailClientContract} recording every message it is asked to
 * deliver, so specs asserting mail flows never touch a real transport (CI has
 * no SMTP service).
 */
export class RecordingMailClient extends MailClientContract {
	readonly sent: MailClientMessage[] = [];

	async send(message: MailClientMessage): Promise<void> {
		this.sent.push(message);
	}
}

/**
 * Swap the {@link MailClientContract} binding for a {@link RecordingMailClient}
 * for the duration of the test.
 *
 * The auth domain sends its token mails synchronously through the mail client
 * (no event bus), so specs covering those flows swap the binding instead of
 * faking the emitter.
 *
 * @returns The recording client (inspect `sent` for delivered messages).
 */
export function swapMailClient(): RecordingMailClient {
	const client = new RecordingMailClient();
	app.container.swap(MailClientContract, () => client);
	return client;
}

/** Restore the real {@link MailClientContract} binding (pairs with {@link swapMailClient}). */
export function restoreMailClient(): void {
	app.container.restore(MailClientContract);
}
