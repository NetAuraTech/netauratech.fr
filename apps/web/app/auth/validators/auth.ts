import vine from '@vinejs/vine';
import { email, password } from '#transport/core/validators/rules';
import type User from '#identity/models/user';

/**
 * Validator to use when performing self-register
 */
export const registerValidator = vine.create({
	email: email().unique({ table: 'users', column: 'email' }),
	password: password().confirmed({
		confirmationField: 'password_confirmation',
	}),
});

export const loginValidator = vine.create({
	email: email(),
	password: password(),
	remember_me: vine.boolean().optional(),
});

export const forgotPasswordValidator = vine.create({
	email: email(),
});

/**
 * Shared two-factor code validator. Used by both the login-time challenge
 * (which accepts a 6-digit TOTP code *or* an unused recovery code) and
 * enrollment confirmation (TOTP only). The field is only required to be
 * present — the {@link TwoFactorService} decides which kind the code is and
 * rejects anything that is not valid for that flow (a wrong code is a
 * rejected request, not a validation error).
 */
export const twoFactorCodeValidator = vine.create({
	code: vine.string().trim().minLength(1),
});

export const resetPasswordValidator = vine.create({
	token: vine.string(),
	password: password().confirmed({
		confirmationField: 'password_confirmation',
	}),
});

export const definePasswordValidator = vine.create({
	password: password().confirmed({
		confirmationField: 'password_confirmation',
	}),
});

export const invitationValidator = vine.create({
	token: vine.string(),
});

export const acceptInvitationValidator = (id?: User['id']) =>
	vine.create({
		email: email().unique(async (query, value) => {
			const user = await query.from('users').where('email', value).whereNot('id', id!).first();

			return !user;
		}),
		username: vine
			.string()
			.trim()
			.minLength(2)
			.maxLength(255)
			.unique(async (query, value) => {
				const user = await query.from('users').where('username', value).whereNot('id', id!).first();

				return !user;
			}),
		password: password().confirmed({
			confirmationField: 'password_confirmation',
		}),
	});
