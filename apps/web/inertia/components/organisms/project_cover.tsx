import { useRef, useState } from 'react';
import FileImage from '~/components/atoms/file_image';
import { Heading } from '~/components/atoms/heading';
import { Kicker } from '~/components/atoms/kicker';
import { Paragraph } from '~/components/atoms/paragraph';
import { GalleryLightbox } from '~/components/molecules/gallery_lightbox';
import { useSequencedReveal } from '~/hooks/animations/use_sequenced_reveal';
import { useTextRise } from '~/hooks/animations/use_text_rise';
import type { ProjectGalleryImage } from '#types/site_content';

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
	images: ProjectGalleryImage[];
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
 * <ProjectCover index={0} rubrique="Application web" title="AdonisJS Foundry" note="Boilerplate production-ready AdonisJS v7" appName="NetAuraTech" images={[{ fileId: 3, alt: 'Panneau d'administration' }]} />
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
		<div ref={coverRef} className="project__cover">
			<div className="project__cover-inner">
				<Kicker className="cover-kicker mb-10">
					{indexLabel} — {rubrique}
				</Kicker>

				<Heading ref={titleRef} level={1} className="cover-title mt-8">
					{title}
				</Heading>

				<p className="cover-lede mt-10 max-w-lg font-news text-base font-light leading-relaxed text-ink-inverted/70 md:text-lg">
					{note}
				</p>

				<div className="cover-meta project__cover-meta">
					<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
						{rubrique} — {appName}
					</Paragraph>
					<Paragraph fs="xs" spacing="xs" className="font-news tracking-[0.3em]" uppercase>
						Fiche {indexLabel}
					</Paragraph>
				</div>
			</div>

			{hasFigures && (
				<div className="cover-figures project__cover-gallery">
					<button
						type="button"
						className="group project__cover-gallery-lead"
						onClick={() => setLightboxIndex(0)}
						aria-label={`Ouvrir ${figureLabel(lead, `${title} — ${rubrique}`)} en plein écran`}
					>
						{'file' in lead ? (
							<FileImage file={lead.file} width={SHOT_W} height={SHOT_H} className="h-auto w-full object-cover" />
						) : (
							<div className="aspect-[16/10] w-full bg-[#0b0b0d]" aria-hidden="true" />
						)}
						<span className="project__cover-gallery-marker" aria-hidden="true">
							+
						</span>
					</button>

					{tiles.length > 0 && (
						<div className="project__cover-gallery-grid">
							{tiles.map((image, i) => (
								<button
									key={`cover-${i}`}
									type="button"
									className="group project__cover-gallery-tile"
									onClick={() => setLightboxIndex(i + 1)}
									aria-label={`Ouvrir ${figureLabel(image, `${title} — ${rubrique}`)} en plein écran`}
								>
									{'file' in image ? (
										<FileImage
											file={image.file}
											loading="lazy"
											width={SHOT_W}
											height={SHOT_H}
											className="h-auto w-full object-cover"
										/>
									) : (
										<div className="aspect-[16/10] w-full bg-[#0b0b0d]" aria-hidden="true" />
									)}
									<span className="project__cover-gallery-marker" aria-hidden="true">
										+
									</span>
								</button>
							))}
						</div>
					)}

					<figcaption className="project__cover-gallery-caption">
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
function figureLabel(image: ProjectGalleryImage, fallback: string): string {
	if ('file' in image) {
		return image.file.alt || fallback;
	}
	return image.alt ?? fallback;
}
