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

import app from '@adonisjs/core/services/app';
import { NavRegistry } from '#core/services/nav_registry';
import { coreNavEntries, maintenanceNavEntries } from '#transport/core/nav';
import { fileNavEntries } from '#transport/file/nav';
import { identityNavEntries } from '#transport/identity/nav';
import { loggingNavEntries } from '#transport/log/nav';

app.container.singleton(NavRegistry, () => new NavRegistry());

const registry = await app.container.make(NavRegistry);

registry.register('core', coreNavEntries);
registry.register('file', fileNavEntries);
registry.register('identity', identityNavEntries);
registry.register('maintenance', maintenanceNavEntries);
registry.register('logging', loggingNavEntries);
