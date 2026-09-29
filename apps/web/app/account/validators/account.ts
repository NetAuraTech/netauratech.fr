import vine from '@vinejs/vine';
import { email, password } from '#transport/core/validators/rules';
import type User from '#identity/models/user';

export const updateEmailValidator = (id: User['id']) =>
	vine.create({
		email: email().unique(async (query, value) => {
			const user = await query.from('users').where('email', value).whereNot('id', id!).first();

			return !user;
		}),
	});

export const updatePasswordValidator = vine.create({
	current_password: password(),
	password: password().confirmed({
		confirmationField: 'password_confirmation',
	}),
});

export const deleteAccountValidator = vine.create({
	password: password(),
});

export const changeEmailValidator = vine.create({
	token: vine.string().trim().toLowerCase(),
});

export const disableTwoFactorValidator = vine.create({
	current_password: password(),
	// Either a 6-digit TOTP code or an unused recovery code (e.g. `ABCDE-FGHJ2`).
	code: vine.string().trim().minLength(1),
});
