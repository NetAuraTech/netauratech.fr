/*
|--------------------------------------------------------------------------
| Sitemap composition
|--------------------------------------------------------------------------
|
| Registers the sitemap contributors of every domain existing in this
| flavor of the application. This file is part of the composition set
| that flavor manifests may rewrite: remove a domain's registration and
| its URLs disappear from `sitemap.xml`.
|
| The route collector is always present (hand-written `core.*.render`
| routes exist in every flavor with a public front). The page collector is
| CMS-specific and is removed by the `inertia` flavor manifest.
|
*/

import app from '@adonisjs/core/services/app';
import { RouteSitemapCollector } from '#core/services/route_sitemap_collector';
import { SitemapRegistry } from '#core/services/sitemap_registry';

app.container.singleton(SitemapRegistry, () => new SitemapRegistry());

const registry = await app.container.make(SitemapRegistry);

registry.register('routes', () => app.container.make(RouteSitemapCollector));
