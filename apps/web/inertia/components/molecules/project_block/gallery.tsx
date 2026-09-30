import FileImage from '~/components/atoms/file_image';
import type { ProjectBlock } from '#types/site_content';

/**
 * Image gallery of a project story.
 *
 * A hairline-separated grid of landscape shots rendered from backend files.
 * Every `id:N` reference is resolved server-side by the page controller and
 * reaches this component as a render-ready file prop. The first image loads
 * eagerly, the rest lazy-load.
 *
 * @example
 * <ProjectGallery block={{ type: 'gallery', images: [{ fileId: 3 }] }} />
 */
export function ProjectGallery({ block }: { block: Extract<ProjectBlock, { type: 'gallery' }> }) {
	const { images } = block;

	return (
		<div className="mt-20 grid gap-3 md:mt-24 lg:grid-cols-2">
			{images.map((image, i) => (
				<figure key={`gallery-${i}`} className="relative aspect-[16/10] overflow-hidden bg-[#0b0b0d]">
					{'file' in image ? (
						<FileImage
							file={image.file}
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
