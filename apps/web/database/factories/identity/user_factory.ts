import factory from '@adonisjs/lucid/factories';
import { DateTime } from 'luxon';
import Role from '#identity/models/role';
import User from '#identity/models/user';

/**
 * Monotonic sequences guarantee unique defaults within a test run: the unit
 * suite does not truncate between tests, and faker pools collide on the
 * unique username/email/name/slug columns (birthday paradox).
 */
let userSequence = 0;
let roleSequence = 0;

export const UserFactory = factory
	.define(User, async () => {
		userSequence++;
		return {
			username: `user_${userSequence}`,
			email: `user_${userSequence}@example.com`,
			password: 'Password123!',
			emailVerifiedAt: DateTime.now(),
		} as unknown as Partial<User>;
	})
	.relation('role', () => RoleFactory)
	.build();

export const RoleFactory = factory
	.define(Role, async () => {
		roleSequence++;
		return {
			name: `Role ${roleSequence}`,
			slug: `role-${roleSequence}`,
			isSystem: false,
		};
	})
	.build();
