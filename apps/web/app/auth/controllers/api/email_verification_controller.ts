import { inject } from '@adonisjs/core';
import { VerifyEmailAction } from '#auth/actions/email_verification/verify_email_action';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import { invalidTokenNotFound } from '#transport/auth/helpers/error_response';
import type { FullToken } from '#auth/enums/token_type';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * POST /api/v1/auth/verify-email — confirm an email address with a token.
 * Returns a canonical 404 error body when the token is invalid.
 */
@inject()
export default class EmailVerificationController {
	constructor(protected verifyEmailAction: VerifyEmailAction) {}

	async store(ctx: HttpContext) {
		const { params, response } = ctx;

		try {
			const user = await this.verifyEmailAction.execute({ token: params.token as FullToken });

			if (!user) {
				return invalidTokenNotFound(ctx);
			}
		} catch (error) {
			if (error instanceof InvalidTokenException) {
				return invalidTokenNotFound(ctx);
			}
			throw error;
		}

		return response.ok({ message: 'email_verified' });
	}
}
