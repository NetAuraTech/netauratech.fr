import { ReactNode, useRef } from 'react';
import { Heading } from '~/components/atoms/heading';
import { Kicker } from '~/components/atoms/kicker';
import { AmbientField } from '~/components/organisms/ambient_field';
import { useSequencedReveal } from '~/hooks/animations/use_sequenced_reveal';
import { useTextRise } from '~/hooks/animations/use_text_rise';

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
 *   kicker={`${app_name} — Développement web sur mesure`}
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
		<div className="hero__wrapper">
			<AmbientField />

			<div ref={heroRef} className="hero">
				<Kicker className="hero__kicker">{kicker}</Kicker>
				<Heading ref={titleRef} level={1}>
					{title}
				</Heading>
				<p className="hero-lede mt-10 max-w-2xl font-news text-base font-light leading-relaxed text-ink-inverted/70 md:text-lg">
					{lede}
				</p>

				<div className="hero__actions">{actions}</div>
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
