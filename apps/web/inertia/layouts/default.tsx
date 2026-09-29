import { SharedProps } from '@adonisjs/inertia/types';
import { Footer } from '@foundry/design-system/footer';
import { Header } from '@foundry/design-system/header';
import { navLink } from '@foundry/design-system/nav-link';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { urlFor } from '~/client';
import { useNavLinkActive } from '~/hooks/use_nav_link_active';

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

	const homeHref = urlFor('core.home.render');
	const homeActive = useNavLinkActive(homeHref);

	// The header's mobile menu is a controlled presentational component — the
	// layout owns its open/close state, including the close-on-navigation
	// behaviour (the package never subscribes to the Inertia router itself).
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const closeMenu = useCallback(() => {
		setIsMenuOpen(false);

		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	}, []);

	useEffect(() => {
		const unregisterListener = router.on('success', closeMenu);

		return () => unregisterListener();
	}, [closeMenu]);

	const footerDescription = (
		<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
			Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam aut culpa cupiditate dignissimos distinctio,
			doloribus et harum id impedit ipsa laboriosam laudantium modi numquam obcaecati omnis, quisquam quod sint ullam!
		</Paragraph>
	);

	const footerCopyright = (
		<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
			{`© 2026 ${app_name} — Tous droits réservés`}
		</Paragraph>
	);

	const footerCredit = (
		<Paragraph variant="ink-inverted" className="text-sm font-light leading-relaxed max-w-md flex items-center gap-2">
			Fait avec ♥ par{' '}
			<a href="https://www.netauratech.fr" className={navLink({ variant: 'external' })}>
				NetAuraTech
			</a>
		</Paragraph>
	);

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
				<Header
					appName={app_name}
					links={[{ label: 'Home', href: homeHref, isActive: homeActive }]}
					isMenuOpen={isMenuOpen}
					onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
					onMenuClose={closeMenu}
				/>
				<Toaster position="top-right" richColors />
				{children}
				<Footer
					appName={app_name}
					homeHref={homeHref}
					description={footerDescription}
					copyright={footerCopyright}
					credit={footerCredit}
				/>
			</>
		</>
	);
}
