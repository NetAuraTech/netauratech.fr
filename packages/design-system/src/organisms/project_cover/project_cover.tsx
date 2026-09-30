import { useRef, useState } from 'react';
import { Heading } from '../../atoms/heading/heading';
import { Image } from '../../atoms/image/image';
import { Kicker } from '../../atoms/kicker/kicker';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import { GalleryLightbox } from '../../molecules/gallery_lightbox/gallery_lightbox';
import { useSequencedReveal } from '../../shared/use_sequenced_reveal';
import { useTextRise } from '../../shared/use_text_rise';
import type { GalleryFigure } from '../../tokens';

interface ProjectCoverProps {
	/** Zero-based position in the project catalogue, drives the `N° — rubrique` kicker and the `Planche` caption. */
	index: number;
	/** Project category, e.g. `'Application web'`. */
	rubrique: string;
	/** Project title rendered as the display headline. */
	title: string;
	/** One-line project description rendered as the lede. */
	note: string;
	/** Site name, shown in the closing meta strip. */
	appName: string;
	/** The project gallery, rendered as a full-width figure band below the intro. */
	images: GalleryFigure[];
}

/** Gallery shot dimensions (16:10). */
const SHOT_W = 1600;
const SHOT_H = 1000;

/**
 * Typographic title page of a single project.
 *
 * The page de garde that opens a project's single page, in the 375 vocabulary:
 * type on the near-black workshop surface, followed by the project gallery as
 * a full-width figure band. Kicker, rising display headline, editorial lede
 * and the closing meta strip form the intro; below it the gallery renders as
 * a lead figure with the other shots in a hairline-separated contact sheet,
 * under a `Planche` caption. Clicking any figure opens it in the fullscreen
 * lightbox, where the gallery loops infinitely. No WebGL. The band is skipped
 * when the project has no gallery, leaving the typographic intro alone. It
 * owns its entrance reveal — kicker, lede, figures and meta fade in while the
 * headline rises.
 *
 * @example
 * <ProjectCover index={0} rubrique="Application web" title="AdonisJS Foundry" note="Boilerplate production-ready" appName="NetAuraTech" images={[{ file: { url: '/a.jpg', alt: 'Panneau d'administration' } }]} />
 */
export function ProjectCover(props: ProjectCoverProps) {
	const { index, rubrique, title, note, appName, images } = props;
	const coverRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);

	useSequencedReveal(coverRef, {
		kicker: '.cover-kicker',
		lede: '.cover-lede',
		tails: ['.cover-figures', '.cover-meta'],
		tailStagger: 0.2,
	});
	useTextRise(titleRef, { delay: 0.955 });

	const indexLabel = String(index + 1).padStart(2, '0');
	const [lead, ...tiles] = images;
	const hasFigures = images.length > 0;
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	return (
		<div
			ref={coverRef}
			className="project__cover relative bg-noir px-5 pt-32 pb-10 text-ink-inverted md:px-16 md:pt-44 md:pb-12"
		>
			<div className="project__cover-inner relative mx-auto w-full max-w-6xl">
				<Kicker className="cover-kicker mb-10">
					{indexLabel} — {rubrique}
				</Kicker>

				<Heading ref={titleRef} level={1} className="cover-title mt-8">
					{title}
				</Heading>

				<p className="cover-lede mt-10 max-w-lg font-news text-base font-light leading-relaxed text-ink-inverted/70 md:text-lg">
					{note}
				</p>

				<div className="cover-meta project__cover-meta mt-16 flex flex-wrap items-end justify-between gap-x-8 gap-y-6 border-t border-ink-inverted/12 pt-5">
					<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
						{rubrique} — {appName}
					</Paragraph>
					<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
						Fiche {indexLabel}
					</Paragraph>
				</div>
			</div>

			{hasFigures && (
				<div className="cover-figures project__cover-gallery relative mx-auto mt-16 w-full max-w-6xl md:mt-24">
					<button
						type="button"
						className="group project__cover-gallery-lead relative block w-full cursor-pointer text-left"
						onClick={() => setLightboxIndex(0)}
						aria-label={`Ouvrir ${figureLabel(lead, `${title} — ${rubrique}`)} en plein écran`}
					>
						{lead.file ? (
							<Image
								source={lead.file}
								width={SHOT_W}
								height={SHOT_H}
								className="h-auto w-full border border-ink-inverted/10 object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
							/>
						) : (
							<div className="aspect-[16/10] w-full bg-noir" aria-hidden="true" />
						)}
						<span
							className="project__cover-gallery-marker absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center border border-ink-inverted/20 bg-noir/70 font-news text-sm leading-none text-ink-inverted/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
							aria-hidden="true"
						>
							+
						</span>
					</button>

					{tiles.length > 0 && (
						<div className="project__cover-gallery-grid mt-4 grid grid-cols-2 gap-3 lg:gap-4">
							{tiles.map((image, i) => (
								<button
									key={`cover-${i}`}
									type="button"
									className="group project__cover-gallery-tile relative block w-full cursor-pointer text-left"
									onClick={() => setLightboxIndex(i + 1)}
									aria-label={`Ouvrir ${figureLabel(image, `${title} — ${rubrique}`)} en plein écran`}
								>
									{image.file ? (
										<Image
											source={image.file}
											loading="lazy"
											width={SHOT_W}
											height={SHOT_H}
											className="h-auto w-full border border-ink-inverted/10 object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
										/>
									) : (
										<div className="aspect-[16/10] w-full bg-noir" aria-hidden="true" />
									)}
									<span
										className="project__cover-gallery-marker absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center border border-ink-inverted/20 bg-noir/70 font-news text-sm leading-none text-ink-inverted/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
										aria-hidden="true"
									>
										+
									</span>
								</button>
							))}
						</div>
					)}

					<figcaption className="project__cover-gallery-caption mt-4 flex items-center justify-between border-t border-ink-inverted/12 pt-3 font-news text-[11px] uppercase tracking-[0.25em] text-ink-inverted/50">
						<span>
							{tiles.length > 0 ? 'Planche' : 'Fig.'} {indexLabel} — {rubrique}
						</span>
						<span aria-hidden="true">{tiles.length > 0 ? `${images.length} vues` : appName}</span>
					</figcaption>
				</div>
			)}

			{lightboxIndex !== null && (
				<GalleryLightbox
					title={title}
					rubrique={rubrique}
					figures={images}
					initialIndex={lightboxIndex}
					onClose={() => setLightboxIndex(null)}
				/>
			)}
		</div>
	);
}

/**
 * Resolve the display label of a gallery figure: the resolved file alt, the
 * inline alt, or the generic fallback.
 *
 * @param image - One gallery figure.
 * @param fallback - Default label used when no alt is set.
 */
function figureLabel(image: GalleryFigure, fallback: string): string {
	if (image.file) {
		return image.file.alt || fallback;
	}
	return image.alt ?? fallback;
}
