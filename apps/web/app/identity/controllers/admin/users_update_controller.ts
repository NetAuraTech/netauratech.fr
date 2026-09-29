import { inject } from '@adonisjs/core';
import { handle } from '#transport/core/rest/page_adapter';
import UsersResource from '#transport/identity/rest/users_resource';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class UsersUpdateController {
	constructor(protected usersResource: UsersResource) {}

	async render(ctx: HttpContext) {
		return handle(ctx, this.usersResource.endpoints.edit);
	}

	async execute(ctx: HttpContext) {
		return handle(ctx, this.usersResource.endpoints.update);
	}
}
