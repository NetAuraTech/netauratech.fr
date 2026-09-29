import type InertiaMiddleware from '#transport/core/middleware/inertia_middleware';
import type { JSONDataTypes } from '@adonisjs/core/types/transformers';
import type { InferFlashData } from '@adonisjs/inertia/types';
import type { Data } from '@generated/data';
import type { PropsWithChildren } from 'react';

export type InertiaProps<T extends JSONDataTypes = {}> = PropsWithChildren<Data.SharedProps & T>;

/**
 * Connects the server's Inertia middleware types to the Inertia v3 client:
 * `sharedPageProps` types every `usePage().props` surface from the
 * middleware's `share()` method (via the generated `Data.SharedProps`
 * alias), and `flashDataType` types `page.flash`, the `onFlash` callback
 * and `router.flash()` from the middleware's `flash()` method.
 */
declare module '@inertiajs/core' {
	interface InertiaConfig {
		sharedPageProps: Data.SharedProps;
		flashDataType: InferFlashData<InertiaMiddleware>;
	}
}
