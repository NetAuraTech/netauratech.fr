import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import User from '#identity/models/user';
import { GetUserDetailQuery } from '#identity/queries/get_user_detail_query';
import type { User as UserDomain } from '#identity/domain/user';

interface GetUserDetailPayload {
	id: number;
}

/**
 * Retrieve a single user by primary key, preloading role with permissions.
 */
@inject()
export class GetUserDetailAction {
	constructor(protected getUserDetailQuery: GetUserDetailQuery) {}

	/**
	 * Execute user detail lookup.
	 *
	 * @param payload - The user ID to retrieve.
	 * @returns The {@link UserDomain} with role and permissions preloaded.
	 * @throws {RowNotFoundException} When no record exists for the given id.
	 *
	 * @example
	 * const user = await getUserDetailAction.execute({ id: 1 })
	 */
	async execute(payload: GetUserDetailPayload): Promise<UserDomain> {
		const user = await this.getUserDetailQuery.execute(payload.id);

		if (!user) {
			throw new RowNotFoundException(User);
		}

		return user;
	}
}
