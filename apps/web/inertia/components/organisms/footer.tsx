import { SharedProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import { NavLink } from '~/components/atoms/nav_link';

export function Footer() {
	const pageProps = usePage<SharedProps>().props;

	return (
		<footer className="border-t border-ink-inverted/15 bg-canvas px-5 py-10 text-ink-inverted/50 md:px-16">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-news text-[11px] uppercase tracking-[0.2em] sm:flex-row">
				<p>
					{pageProps.app_name} · © {new Date().getFullYear()}
				</p>
				<p>
					Propulsé par <NavLink label="AdonisJsFoundry" href="https://github.com/NetAuraTech/adonisjs-foundry" /> ·
					Hauts-de-France
				</p>
			</div>
		</footer>
	);
}
