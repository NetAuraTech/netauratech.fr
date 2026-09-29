/*
|--------------------------------------------------------------------------
| Account front routes
|--------------------------------------------------------------------------
|
| Self-service settings: profile, account (credentials, email change,
| deletion), preferences, and the settings redirect index. Self-registers
| on import (see `app/account/routes.ts`), gated by the `settings` feature
| flag. Public URLs live under `/settings/*`; route names carry the
| `account` prefix.
|
*/

import router from '@adonisjs/core/services/router';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { throttle } from '#start/limiter';
import { maintenanceMiddleware } from '#transport/core/maintenance';

if (features.settings) {
	router
		.group(() => {
			router
				.group(() => {
					router.get('/', [controllers.account.front.Profile, 'render']);
					router.post('/', [controllers.account.front.Profile, 'execute']);
				})
				.prefix('profile')
				.use([middleware.auth({ guards: ['web'] })]);

			router
				.group(() => {
					router
						.group(() => {
							router.get('/', [controllers.account.front.Account, 'render']);
							router.post('/', [controllers.account.front.Account, 'execute']);
							router.delete('/', [controllers.account.front.Account, 'destroy']);
						})
						.use([middleware.auth({ guards: ['web'] })]);

					router
						.group(() => {
							router.get('/:token', [controllers.account.front.EmailChange, 'render']);
							// Consumes an emailed token (account-takeover vector):
							// same budget as the reset-password endpoint.
							router.post('/', [controllers.account.front.EmailChange, 'execute']).use([throttle(3, 900)]);
						})
						.prefix('email_change');
				})
				.prefix('account');

			router
				.group(() => {
					router.get('/', [controllers.account.front.Preferences, 'render']);
					router.post('/', [controllers.account.front.Preferences, 'execute']);
				})
				.prefix('preferences')
				.use([middleware.auth({ guards: ['web'] })]);

			router
				.get('/', function (ctx) {
					const { response } = ctx;

					return response.redirect().toRoute('account.profile.render');
				})
				.as('index')
				.use([middleware.auth({ guards: ['web'] })]);
		})
		.prefix('settings')
		.as('account')
		.use(maintenanceMiddleware);
}
