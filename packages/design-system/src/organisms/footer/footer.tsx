import { cn, tv } from 'tailwind-variants';
import type { ReactNode } from 'react';

const footer = tv({
	base: 'border-t border-ink-inverted/15 bg-canvas px-5 py-10 text-ink-inverted/50 md:px-16',
});

interface FooterProps {
	/** The application name, rendered as the brand on the copyright line. */
	appName: string;
	/**
	 * The right-hand credit line — a "made by" link, region, etc. Injected by
	 * the caller so the footer owns no app copy or routes.
	 */
	credit?: ReactNode;
	/** Additional Tailwind classes merged onto the `<footer>`. */
	className?: string;
}

/**
 * Public-facing front footer.
 *
 * A single centered hairline-topped row on the near-black canvas: the brand
 * and copyright on the left, an injected credit line on the right. All copy —
 * the credit in particular — is injected by the caller; the footer resolves no
 * routes and owns no app data.
 *
 * @example
 * <Footer appName="NetAuraTech" credit={<>Propulsé par <NavLink … /> · Hauts-de-France</>} />
 */
export function Footer(props: FooterProps) {
	const { appName, credit, className } = props;
	const year = new Date().getFullYear();

	return (
		<footer className={cn(footer(), className)}>
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-news text-[11px] uppercase tracking-[0.2em] sm:flex-row">
				<p>
					{appName} · © {year}
				</p>
				{credit}
			</div>
		</footer>
	);
}
