import type { FullToken } from '#auth/enums/token_type';

/**
 * Payload for self-registration (front and token API surfaces).
 */
export interface RegisterPayload {
	email: string;
	password: string;
	locale: string;
}

/**
 * Payload for confirming a password reset.
 */
export interface ResetPasswordPayload {
	token: FullToken;
	password: string;
}

/**
 * OAuth providers supported by the Ally configuration.
 */
export type OAuthProvider = 'github' | 'google' | 'facebook';
