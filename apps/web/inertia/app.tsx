import './css/app.css';
import { resolvePageComponent } from '@adonisjs/inertia/helpers';
import { TuyauProvider } from '@adonisjs/inertia/react';
import { Data } from '@generated/data';
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '~/components/atoms/error_boundary';
import Layout from '~/layouts/default';
import { initSentry } from '~/lib/sentry';
import { client } from './client';

initSentry();

let appName = '';

createInertiaApp({
	// Public front pages already include the app name in their title (the same string feeds og:title),
	// so only append it when it is missing — otherwise the brand is duplicated.
	title: (title) => (title ? (title.includes(appName) ? title : `${title} - ${appName}`) : appName),
	resolve: (name) => {
		return resolvePageComponent<ResolvedComponent>(
			`./pages/${name}.tsx`,
			import.meta.glob<ResolvedComponent>(['./pages/**/*.tsx', '!./pages/**/*.spec.tsx']),
			(page: ReactElement<Data.SharedProps>) => <Layout children={page} />,
		);
	},
	setup({ el, App, props }) {
		appName = props.initialPage.props.app_name as string;

		createRoot(el).render(
			<TuyauProvider client={client}>
				<ErrorBoundary>
					<App {...props} />
				</ErrorBoundary>
			</TuyauProvider>,
		);
	},
	progress: {
		color: '#4B5563',
	},
});
