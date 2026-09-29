import { DateTime } from 'luxon';
import { extractNameFromEmail } from '#identity/domain/user';
import User from '#identity/models/user';

/**
 * Creates a new user with a verified email address.
 *
 * The username is automatically derived from the email's local part
 * unless explicitly overridden. The email is marked as verified
 * immediately using the current timestamp.
 *
 * @param overrides - User attributes. `email` is required; `username`
 *   and `password` are optional and will override the generated defaults.
 * @returns The newly created and verified user instance.
 *
 * @example
 * const user = await createVerifiedUser({ email: 'alice@example.com' })
 * // user.emailVerifiedAt === DateTime.now()
 * // user.username === 'alice'
 */
export async function createVerifiedUser(overrides: {
	email: string;
	username?: string;
	password?: string;
	pendingEmail?: string;
	apiRateLimit?: number | null;
}) {
	return User.create({
		username: extractNameFromEmail(overrides.email),
		...overrides,
		emailVerifiedAt: DateTime.now(),
	});
}
