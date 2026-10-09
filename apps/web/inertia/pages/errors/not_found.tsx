import { Head } from '@inertiajs/react';

/**
 * Public 404 surface. The root layout emits the `noindex, nofollow` robots
 * meta for every `errors/*` page, so this page only sets its own title.
 */
export default function NotFound() {
	return (
		<>
			<Head>
				<title>Page introuvable</title>
			</Head>
			<h1>Page not found</h1>
		</>
	);
}
