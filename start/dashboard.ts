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

import app from '@adonisjs/core/services/app'
import { DashboardRegistry } from '#services/core/dashboard_registry'
import { AuthDashboardCollector } from '#services/auth/auth_dashboard_collector'
import { FileDashboardCollector } from '#services/file/file_dashboard_collector'

app.container.singleton(DashboardRegistry, () => new DashboardRegistry())

const registry = await app.container.make(DashboardRegistry)

registry.register('auth', () => app.container.make(AuthDashboardCollector))
registry.register('file', () => app.container.make(FileDashboardCollector))
