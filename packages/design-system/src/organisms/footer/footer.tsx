import { Link } from '@inertiajs/react';
import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const footer = tv({
	base: 'bg-primary-deep px-6 md:px-16 pt-14 pb-8',
});

interface FooterProps {
	/** The application name, rendered as the home link. */
	appName: string;
	/** Resolved URL the logo link navigates to (built by the caller). */
	homeHref: string;
	/** Brand description shown under the logo. Injected by the caller. */
	description?: ReactNode;
	/** Bottom-left line (e.g. the copyright notice). Injected by the caller. */
	copyright?: ReactNode;
	/** Bottom-right line (e.g. a "made by" credit). Injected by the caller. */
	credit?: ReactNode;
	/** Additional Tailwind classes merged onto the `<footer>`. */
	className?: string;
}

/**
 * Public-facing site footer.
 *
 * Lays out a brand block (logo + description) on the left, two reserved
 * columns, and a bottom row with a copyright and a credit line. All copy is
 * injected by the caller — the footer owns no app text, no app name, and
 * resolves no routes.
 *
 * @example
 * <Footer
 *   appName="Foundry"
 *   homeHref={urlFor('core.home.render')}
 *   description={<Paragraph variant="ink-inverted">…</Paragraph>}
 *   copyright={<Paragraph variant="ink-inverted">© 2026 Foundry</Paragraph>}
 * />
 */
export function Footer(props: FooterProps) {
	const { appName, homeHref, description, copyright, credit, className } = props;

	return (
		<footer className={cn(footer(), className)}>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-10 mb-8 border-b border-primary">
				<div className="col-span-2 md:col-span-1">
					<Link href={homeHref} className="text-ink-inverted font-semibold tracking-wide text-xl font-cormorant">
						{appName}
					</Link>
					{description}
				</div>
				<div className="grid gap-1.5"></div>
				<div className="grid gap-1.5"></div>
			</div>
			<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
				{copyright}
				{credit}
			</div>
		</footer>
	);
}
