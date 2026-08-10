/*
|--------------------------------------------------------------------------
| Admin navigation composition
|--------------------------------------------------------------------------
|
| Registers the admin navigation entries of every domain existing in this
| flavor of the application, in sidebar order. This file is part of the
| composition set that flavor manifests may rewrite: remove a domain's
| registration and its entries disappear from the admin sidebar.
|
*/

import app from '@adonisjs/core/services/app'
import { NavRegistry } from '#services/core/nav_registry'
import { coreNavEntries } from '#services/core/core_nav'
import { authNavEntries } from '#services/auth/auth_nav'
import { fileNavEntries } from '#services/file/file_nav'
import { maintenanceNavEntries } from '#services/maintenance/maintenance_nav'
import { loggingNavEntries } from '#services/logging/logging_nav'

app.container.singleton(NavRegistry, () => new NavRegistry())

const registry = await app.container.make(NavRegistry)

registry.register('core', coreNavEntries)
registry.register('file', fileNavEntries)
registry.register('auth', authNavEntries)
registry.register('maintenance', maintenanceNavEntries)
registry.register('logging', loggingNavEntries)
