import { SharedProps } from '@adonisjs/inertia/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactElement, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { Footer } from '~/components/organisms/footer';
import { Header } from '~/components/organisms/header';

interface LayoutProps {
	children: ReactElement<SharedProps>;
}

/**
 * Root layout for all public-facing pages.
 */
export default function Layout(props: LayoutProps) {
	const { children } = props;
	const { props: pageProps, url, flash } = usePage<SharedProps>();
	const { app_name, app_url } = pageProps;
	const isFront = url === '/';
	// The projects listing is a sealed frame on desktop: only the list scrolls, so
	// the footer is kept off the desktop layout (reference behaviour) and is
	// shown again in the normal document flow on smaller screens. Single project
	// pages are regular scrolling editorial pages and keep the normal footer.
	const isProjectsFrame = url === '/projets';

	useEffect(() => {
		toast.dismiss();

		if (flash.error) toast.error(flash.error);
		if (flash.success) toast.success(flash.success);
		if (flash.info) toast.info(flash.info);
	}, [url, flash]);

	const image_alt = '';
	const geo = {
		region: '',
		placename: '',
	};

	return (
		<>
			<Head>
				<link rel="canonical" href={`${app_url}${url}`} />
				<link rel="preconnect" href="https://api.iconify.design" />
				<link rel="dns-prefetch" href="https://api.iconify.design" />
				<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
				<meta name="language" content="fr" />
				<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="shortcut icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<meta name="apple-mobile-web-app-title" content={app_name} />
				<link rel="manifest" href="/site.webmanifest" />
				<meta property="og:url" content={`${app_url}${url}`} />
				<meta property="og:site_name" content={app_name} />
				<meta property="og:type" content="website" />
				<meta property="og:locale" content="fr_FR" />
				<meta property="og:image:alt" content={`${app_name} - ${image_alt}`} />
				<meta name="geo.region" content={geo.region} />
				<meta name="geo.placename" content={geo.placename} />
				<meta name="author" content={app_name} />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={app_name} />
				<meta name="twitter:image:alt" content={`${app_name} - ${image_alt}`} />
			</Head>
			<>
				{isFront && <style>{`body, #page-wrapper, #site { background: #050505 !important; }`}</style>}
				<Header />
				<Toaster position="top-right" richColors />
				{children}
				{isProjectsFrame ? (
					<>
						<div className="lg:hidden">
							<Footer />
						</div>
						<div className="fixed inset-x-0 bottom-0 z-[60] hidden lg:block">
							<Footer />
						</div>
					</>
				) : (
					<Footer />
				)}
			</>
		</>
	);
}
