import { Entity } from '#core/domain/entity';
import { UserIdentifier } from '#identity/domain/identifiers';
import type { Role } from '#identity/domain/role';

/**
 * The lifecycle status of a user, derived purely from whether they hold a
 * pending-invite token and whether their email is verified.
 */
export type UserStatusValue = 'PENDING_INVITE' | 'VERIFIED' | 'UNVERIFIED';

/**
 * The set of {@link UserStatusValue}s a user can be in. Serves as the
 * single source of truth for the status enum (consumed by the OpenAPI docs).
 */
export const USER_STATUSES: readonly UserStatusValue[] = ['PENDING_INVITE', 'VERIFIED', 'UNVERIFIED'];

/**
 * Derives a user's {@link UserStatusValue} from their pending-invite and
 * email-verification state. A user awaiting an invitation token is
 * {@link UserStatusValue.PENDING_INVITE}; otherwise a user whose email is
 * verified is {@link UserStatusValue.VERIFIED}; everything else is
 * {@link UserStatusValue.UNVERIFIED}.
 */
export const UserStatus = {
	derive(hasPendingInvite: boolean, isEmailVerified: boolean): UserStatusValue {
		if (hasPendingInvite) {
			return 'PENDING_INVITE';
		}
		if (isEmailVerified) {
			return 'VERIFIED';
		}
		return 'UNVERIFIED';
	},
} as const;

/**
 * Pure domain object for an identity {@link User}.
 *
 * Encapsulates the business rules of a user outside the persistence layer.
 * The Lucid `User` model is the persistence representation; this object
 * carries the derived lifecycle status and the username-derivation rules.
 * Hydrate one from a model with {@link User.fromModel}.
 */
export class User extends Entity<{
	id: UserIdentifier;
	username: string;
	email: string;
	apiRateLimit: number | null;
	hasPendingInvite: boolean;
	isEmailVerified: boolean;
	emailVerifiedAt: Date | null;
	hasGithubId: boolean;
	hasGoogleId: boolean;
	hasFacebookId: boolean;
	role: Role | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}> {
	private constructor(
		readonly id: UserIdentifier,
		readonly username: string,
		readonly email: string,
		readonly apiRateLimit: number | null,
		private readonly hasPendingInvite: boolean,
		private readonly isEmailVerified: boolean,
		readonly emailVerifiedAt: Date | null,
		readonly hasGithubId: boolean,
		readonly hasGoogleId: boolean,
		readonly hasFacebookId: boolean,
		readonly role: Role | null,
		readonly createdAt: Date | null,
		readonly updatedAt: Date | null,
	) {
		super({
			id,
			username,
			email,
			apiRateLimit,
			hasPendingInvite,
			isEmailVerified,
			emailVerifiedAt,
			hasGithubId,
			hasGoogleId,
			hasFacebookId,
			role,
			createdAt,
			updatedAt,
		});
	}

	/**
	 * Hydrate a domain user from its Lucid model representation.
	 *
	 * @param model - The persisted user. `hasPendingInvite` is a runtime flag
	 *   set by the model's post-fetch hook; `isEmailVerified` may be supplied
	 *   directly or derived from `emailVerifiedAt`. `role` is a domain-hydrated
	 *   relation: `null` means the user has no role or the relation was not
	 *   loaded.
	 */
	static fromModel(model: {
		id: number;
		username: string;
		email: string;
		apiRateLimit?: number | null;
		hasPendingInvite?: boolean;
		isEmailVerified?: boolean;
		emailVerifiedAt?: Date | null;
		githubId?: string | null;
		googleId?: string | null;
		facebookId?: string | null;
		role?: Role | null;
		createdAt?: Date | null;
		updatedAt?: Date | null;
	}): User {
		const isEmailVerified =
			model.isEmailVerified ?? (model.emailVerifiedAt !== null && model.emailVerifiedAt !== undefined);
		return new User(
			UserIdentifier.of(model.id),
			model.username,
			model.email,
			model.apiRateLimit ?? null,
			!!model.hasPendingInvite,
			isEmailVerified,
			model.emailVerifiedAt ?? null,
			!!model.githubId,
			!!model.googleId,
			!!model.facebookId,
			model.role ?? null,
			model.createdAt ?? null,
			model.updatedAt ?? null,
		);
	}

	/** The derived lifecycle status of this user. */
	status(): UserStatusValue {
		return UserStatus.derive(this.hasPendingInvite, this.isEmailVerified);
	}
}

/**
 * Derives a human-readable display name from an email address.
 *
 * Extracts the local part (before `@`), strips all digits, replaces the
 * common separators (`.` `_` `-` `+`) with spaces, and title-cases each
 * resulting word.
 *
 * @param email - The email address to extract a name from.
 * @returns A title-cased display name, or an empty string if no usable
 *   characters remain after sanitisation.
 *
 * @example
 * extractNameFromEmail('john.doe@example.com')  // 'John Doe'
 * extractNameFromEmail('jane_smith42@example.com') // 'Jane Smith'
 * extractNameFromEmail('user+tag@example.com')  // 'User Tag'
 */
export function extractNameFromEmail(email: string): string {
	const local = email.split('@')[0];

	const name = local.replace(/[0-9]/g, '').replace(/[._\-+]/g, ' ');

	return name
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Generates a unique username by appending a numeric suffix if the base
 * username is already taken.
 *
 * @param base - The desired username (already sanitised).
 * @param exists - Async function that checks if a username is taken.
 * @returns A unique username.
 *
 * @example
 * await generateUniqueUsername('johndoe', (u) => userRepository.exists({ username: u }))
 * // 'johndoe' if free, 'johndoe1', 'johndoe2', etc.
 */
export async function generateUniqueUsername(
	base: string,
	exists: (username: string) => Promise<boolean>,
): Promise<string> {
	if (!(await exists(base))) {
		return base;
	}

	let counter = 1;
	while (await exists(`${base}${counter}`)) {
		counter++;
	}

	return `${base}${counter}`;
}
