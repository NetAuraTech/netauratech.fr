import { resolvePageComponent } from '@adonisjs/inertia/helpers';
import { TuyauProvider } from '@adonisjs/inertia/react';
import { Data } from '@generated/data';
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import { client } from '~/client';
import Layout from '~/layouts/default';

export default function render(page: any) {
	let appName = '';

	return createInertiaApp({
		page,
		render: ReactDOMServer.renderToString,
		// Public front pages already include the app name in their title (the same string feeds og:title),
		// so only append it when it is missing — otherwise the brand is duplicated.
		title: (title) => (title ? (title.includes(appName) ? title : `${title} - ${appName}`) : appName),
		resolve: (name) => {
			return resolvePageComponent<ResolvedComponent>(
				`./pages/${name}.tsx`,
				import.meta.glob<ResolvedComponent>(['./pages/**/*.tsx', '!./pages/**/*.spec.tsx'], {
					eager: true,
				}),
				(page: ReactElement<Data.SharedProps>) => <Layout children={page} />,
			);
		},
		setup: ({ App, props }) => {
			appName = props.initialPage.props.app_name as string;

			return (
				<TuyauProvider client={client}>
					<App {...props} />
				</TuyauProvider>
			);
		},
	});
}
