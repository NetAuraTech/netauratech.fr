import vine from '@vinejs/vine';
import { email } from '#transport/core/validators/rules';
import type Role from '#identity/models/role';
import type User from '#identity/models/user';

const id = () => vine.number().exists({ table: 'users', column: 'id' });
const username = () => vine.string().trim().minLength(2).maxLength(255);

export const listValidator = (ids: Role['slug'][]) =>
	vine.create({
		search: vine.string().trim().maxLength(100).optional(),
		role: vine.string().trim().in(ids).optional(),
	});

export const showValidator = vine.create({
	id: id(),
});

export const editValidator = vine.create({
	id: id(),
});

export const createValidator = (role_ids: Role['slug'][]) =>
	vine.create({
		email: email().unique(async (query, value) => {
			const user = await query.from('users').where('email', value).first();

			return !user;
		}),
		username: username().unique(async (query, value) => {
			const user = await query.from('users').where('username', value).first();

			return !user;
		}),
		role_id: vine.string().trim().in(role_ids),
	});

export const updateValidator = (user_id: User['id'], role_ids: Role['slug'][]) =>
	vine.create({
		email: email().unique(async (query, value) => {
			const user = await query.from('users').where('email', value).whereNot('id', user_id!).first();

			return !user;
		}),
		username: username().unique(async (query, value) => {
			const user = await query.from('users').where('username', value).whereNot('id', user_id!).first();

			return !user;
		}),
		role_id: vine.string().trim().in(role_ids),
		api_rate_limit: vine.number().positive().withoutDecimals().optional().nullable(),
	});

export const deleteValidator = vine.create({
	id: id(),
});

export { restIdValidator } from '#transport/core/validators/rest';
