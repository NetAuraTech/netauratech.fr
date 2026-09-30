import { useRef } from 'react';
import { Heading } from '../../atoms/heading/heading';
import { Kicker } from '../../atoms/kicker/kicker';
import { useSequencedReveal } from '../../shared/use_sequenced_reveal';
import { useTextRise } from '../../shared/use_text_rise';
import { AmbientField } from '../ambient_field/ambient_field';
import type { ReactNode } from 'react';

interface HeroProps {
	/** Kicker line rendered above the title, with its accent dot. */
	kicker: ReactNode;
	/** Headline. Emphasized words may be wrapped in `<em>` per the Italic-Accent rule. */
	title: ReactNode;
	/** Short editorial lead paragraph under the title. */
	lede: ReactNode;
	/** Call-to-action cluster, typically two `Button`s. */
	actions: ReactNode;
	/** Delay in seconds before the headline rise starts. Defaults to `0`. */
	titleDelay?: number;
}

/**
 * Publication hero of the public front.
 *
 * The near-black opening block used by every front page: ambient WebGL field,
 * kicker, numbered headline, editorial lead, CTA cluster, closed by the fixed
 * bottom-right location note. It owns its entrance reveal — the sequential
 * fade-in of kicker, lead and actions plus the rising headline — so pages only
 * compose content.
 *
 * @example
 * <Hero
 *   kicker={`${appName} — Développement web sur mesure`}
 *   title={<>Créez un site web <em>unique</em>.</>}
 *   lede="Sites vitrines, boutiques en ligne et applications web."
 *   titleDelay={0.955}
 *   actions={<Button variant="primary" href="#contact" fitContent>Démarrer un projet</Button>}
 * />
 */
export function Hero(props: HeroProps) {
	const { kicker, title, lede, actions, titleDelay = 0 } = props;
	const heroRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);

	useSequencedReveal(heroRef, {
		kicker: '.hero__kicker',
		lede: '.hero-lede',
		tails: ['.hero__actions'],
	});
	useTextRise(titleRef, { delay: titleDelay });

	return (
		<div className="hero__wrapper relative bg-noir px-5 pt-32 pb-16 text-ink-inverted md:px-16 md:pt-44 md:pb-24">
			<AmbientField />

			<div ref={heroRef} className="hero relative mx-auto max-w-6xl">
				<Kicker className="hero__kicker mb-10">{kicker}</Kicker>
				<Heading ref={titleRef} level={1}>
					{title}
				</Heading>
				<p className="hero-lede mt-10 max-w-2xl font-news text-base font-light leading-relaxed text-ink-inverted/70 md:text-lg">
					{lede}
				</p>

				<div className="hero__actions mt-14 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">{actions}</div>
			</div>

			<p
				className="absolute bottom-5 right-5 hidden font-news text-[11px] tracking-[0.25em] text-ink-inverted/40 md:block"
				aria-hidden="true"
			>
				Hauts-de-France · disponible partout
			</p>
		</div>
	);
}
