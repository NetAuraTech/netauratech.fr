/*
|--------------------------------------------------------------------------
| Feature flags
|--------------------------------------------------------------------------
|
| Runtime toggles to enable or disable route modules.
| All features are enabled by default — change a boolean to
| deactivate a module at runtime without touching routing code.
|
| The `inertia` flavor drops the CMS module (page/template/builder): the
| `cms` flag is off and the CMS route registrations are absent from
| `start/routes.ts`.
*/

export default {
	auth: true,
	settings: true,
	admin: true,
	adminApi: true,
	apiDocs: true,
	cms: false,
	maintenance: true,
} as const;
