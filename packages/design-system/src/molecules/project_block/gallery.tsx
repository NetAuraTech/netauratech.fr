import { Image } from '../../atoms/image/image';
import type { ProjectBlock } from '../../tokens';

/**
 * Image gallery of a project story.
 *
 * A hairline-separated grid of landscape shots rendered from resolved image
 * sources. Every reference is resolved server-side by the page controller and
 * reaches this component as a render-ready source; figures without a file
 * degrade to an empty placeholder. The first image loads eagerly, the rest
 * lazy-load.
 *
 * @example
 * <ProjectGallery block={{ type: 'gallery', images: [{ file: { url: '/a.jpg' } }] }} />
 */
export function ProjectGallery({ block }: { block: Extract<ProjectBlock, { type: 'gallery' }> }) {
	const { images } = block;

	return (
		<div className="mt-20 grid gap-3 md:mt-24 lg:grid-cols-2">
			{images.map((image, i) => (
				<figure key={`gallery-${i}`} className="relative aspect-[16/10] overflow-hidden bg-noir">
					{image.file ? (
						<Image
							source={image.file}
							alt={image.alt ?? image.file.alt}
							loading={i === 0 ? 'eager' : 'lazy'}
							className="absolute inset-0 h-full w-full object-cover"
						/>
					) : (
						<div className="absolute inset-0 h-full w-full" aria-hidden="true" />
					)}
				</figure>
			))}
		</div>
	);
}
