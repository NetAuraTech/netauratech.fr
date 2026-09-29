import { BaseQuery } from '#core/queries/base_query';
import User from '#identity/models/user';
import type { User as UserDomain } from '#identity/domain/user';

/**
 * Read-side query for a single user by primary key, preloading the user's role
 * with its permissions. Returns `null` when no user matches the id.
 */
export class GetUserDetailQuery extends BaseQuery {
	/**
	 * Execute the user detail query.
	 *
	 * @param id - The user primary key to retrieve.
	 * @returns The {@link UserDomain} with role and permissions preloaded, or `null`.
	 */
	async execute(id: number): Promise<UserDomain | null> {
		const user = await User.query(this.client()).where('id', id).first();

		if (!user) {
			return null;
		}

		await user.load('role', (query) => {
			query.preload('permissions');
		});

		return user.toDomain();
	}
}
