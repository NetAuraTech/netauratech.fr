/**
 * Token types issued by the auth domain.
 *
 * Every {@link Token} record is scoped to exactly one of these types, which
 * drives its TTL, its verification entry point, and the mail flow that
 * created it.
 */
export const TOKEN_TYPES = {
	PASSWORD_RESET: 'PASSWORD_RESET',
	EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
	EMAIL_CHANGE: 'EMAIL_CHANGE',
	PENDING_INVITE: 'PENDING_INVITE',
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

/**
 * A full token as presented in a URL or request payload:
 * `"<selector>.<validator>"`.
 */
export type FullToken = `${string}.${string}`;
