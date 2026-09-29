/*
|--------------------------------------------------------------------------
| Dashboard composition
|--------------------------------------------------------------------------
|
| Registers the dashboard section collectors of every domain existing in
| this flavor of the application. This file is part of the composition set
| that flavor manifests may rewrite: remove a domain's registration and
| its section disappears from the admin dashboard.
|
*/

import app from '@adonisjs/core/services/app';
import { DashboardRegistry } from '#core/services/dashboard_registry';
import { FileDashboardCollector } from '#file/services/file_dashboard_collector';
import { IdentityDashboardCollector } from '#identity/services/identity_dashboard_collector';

app.container.singleton(DashboardRegistry, () => new DashboardRegistry());

const registry = await app.container.make(DashboardRegistry);

registry.register('identity', () => app.container.make(IdentityDashboardCollector));
registry.register('file', () => app.container.make(FileDashboardCollector));
