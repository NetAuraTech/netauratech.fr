import { Link } from '@adonisjs/inertia/react';
import FileImage from '~/components/atoms/file_image';
import { Heading } from '~/components/atoms/heading';
import type { SiteProject } from '#types/site_content';

interface ProjectRowProps {
	/** Zero-based position in the filtered listing. Drives the eager/lazy image loading. */
	index: number;
	/** The parsed project entry, from `content/projects/`. */
	project: SiteProject;
}

/**
 * Project row of the public projects list.
 *
 * One full-width landscape entry of the two-column portfolio frame: the cover
 * image (rendered by `useProjectDistortion`) fills the row, under a
 * bottom-led readability gradient borrowed from the home plates, and the title
 * overlays its bottom-left corner on desktop — sliding below the image on
 * smaller screens. A `data-loupe` hook lets the cursor loupe target the row.
 *
 * @example
 * <ProjectRow index={0} project={project} />
 */
export function ProjectRow(props: ProjectRowProps) {
	const { index, project } = props;
	const { coverFile } = project;

	return (
		<Link
			route="core.projects.show.render"
			routeParams={{ slug: project.slug }}
			data-project-row
			data-loupe
			className="projects__row"
		>
			<div data-project-row-media className="projects__row-media">
				{coverFile ? (
					<FileImage file={coverFile} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
				) : (
					<div className="h-full w-full bg-[#0b0b0d]" aria-hidden="true" />
				)}
				<div
					data-project-row-overlay
					className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
					aria-hidden="true"
				/>
			</div>
			<div className="mt-5 lg:absolute lg:bottom-6 lg:left-6 lg:mt-0 lg:w-[80%] lg:mix-blend-exclusion">
				<Heading level={3}>{project.title}</Heading>
			</div>
		</Link>
	);
}
