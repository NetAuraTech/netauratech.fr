import { Link } from '@inertiajs/react';
import { Heading } from '../../atoms/heading/heading';
import { Image } from '../../atoms/image/image';
import type { ImageSource } from '../../tokens';

interface ProjectRowProps {
	/** Zero-based position in the filtered listing. Drives the eager/lazy image loading. */
	index: number;
	/** Project title, overlaid on the cover. */
	title: string;
	/** The cover, resolved against the backend file module. */
	coverFile?: ImageSource;
	/** Resolved URL of the project's single page. */
	href: string;
}

/**
 * Project row of the public projects list.
 *
 * One full-width landscape entry of the two-column portfolio frame: the cover
 * image fills the row, under a bottom-led readability gradient borrowed from the
 * home plates, and the title overlays its bottom-left corner on desktop —
 * sliding below the image on smaller screens. A `data-loupe` hook lets the
 * cursor loupe target the row; the `[data-project-row-media]` /
 * `[data-project-row-overlay]` hooks let the parent deform the image.
 *
 * @example
 * <ProjectRow index={0} title="AdonisJS Foundry" coverFile={cover} href="/projets/adonisjs-foundry" />
 */
export function ProjectRow({ index, title, coverFile, href }: ProjectRowProps) {
	return (
		<Link href={href} data-project-row data-loupe className="relative block mb-3 lg:mb-4">
			<div data-project-row-media className="relative aspect-video overflow-hidden">
				{coverFile ? (
					<Image source={coverFile} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
				) : (
					<div className="h-full w-full bg-noir" aria-hidden="true" />
				)}
				<div
					data-project-row-overlay
					className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
					aria-hidden="true"
				/>
			</div>
			<div className="mt-5 lg:absolute lg:bottom-6 lg:left-6 lg:mt-0 lg:w-[80%] lg:mix-blend-exclusion">
				<Heading level={3}>{title}</Heading>
			</div>
		</Link>
	);
}
