import { Head } from '@inertiajs/react';

/**
 * Public 500 surface. The root layout emits the `noindex, nofollow` robots
 * meta for every `errors/*` page, so this page only sets its own title.
 */
export default function ServerError() {
	return (
		<>
			<Head>
				<title>Erreur serveur</title>
			</Head>
			<h1>Something went wrong</h1>
		</>
	);
}
