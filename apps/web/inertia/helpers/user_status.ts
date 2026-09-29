import type { UserStatusKind } from '@foundry/design-system/user-status';

/**
 * Maps the app's uppercase user status value (see `UserStatusValue` in the
 * identity domain) to the design system's lowercase {@link UserStatusKind}.
 * Any unrecognized value resolves to `'unverified'`.
 *
 * @param status - The raw status value carried by `Data.Identity.User`.
 * @returns The matching {@link UserStatusKind}.
 *
 * @example
 * toUserStatusKind('VERIFIED') // 'verified'
 */
export function toUserStatusKind(status?: string): UserStatusKind {
	switch (status?.toUpperCase()) {
		case 'VERIFIED':
			return 'verified';
		case 'PENDING_INVITE':
			return 'pending_invite';
		default:
			return 'unverified';
	}
}
