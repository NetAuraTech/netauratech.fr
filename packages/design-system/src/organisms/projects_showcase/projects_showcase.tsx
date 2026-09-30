import { useEffect, useRef, useState } from 'react';
import { Button } from '../../atoms/button/button';
import { Heading } from '../../atoms/heading/heading';
import { Kicker } from '../../atoms/kicker/kicker';
import { Paragraph } from '../../atoms/paragraph/paragraph';
import { ProjectRow } from '../../molecules/project_row/project_row';
import { useTextRise } from '../../shared/use_text_rise';
import { AmbientField } from '../ambient_field/ambient_field';
import { useProjectDistortion } from './use_project_distortion';
import { useProjectsList } from './use_projects_list';
import type { ImageSource } from '../../tokens';
import type { ReactNode } from 'react';

/** One entry of the portfolio, pre-resolved by the caller. */
export interface ShowcaseEntry {
	/** Zero-based position in the full listing. */
	index: number;
	/** Project title, overlaid on the cover. */
	title: string;
	/** The cover, resolved against the backend file module. */
	coverFile?: ImageSource;
	/** Project category, used by the filter. */
	rubrique: string;
	/** Resolved URL of the project's single page. */
	href: string;
}

interface ProjectsShowcaseProps {
	/** Kicker line rendered above the title, with its accent dot. */
	kicker: ReactNode;
	/** Section headline. Emphasized words may be wrapped in `<em>`. */
	title: ReactNode;
	/** Editorial lead rendered in the bottom strip. */
	lede: ReactNode;
	/** The full (unfiltered) portfolio, pre-resolved by the caller. */
	projects: ShowcaseEntry[];
	/** Label of the "everything" filter entry. Defaults to `'Tout'`. */
	allLabel?: string;
}

/** Breakpoint at which the two-column fixed frame (and the infinite list) kicks in. */
const DESKTOP_BREAKPOINT = '(min-width: 1024px)';

/** Sentinel category label rendering every project of the portfolio. */
const ALL_CATEGORY = 'all';

/**
 * Portfolio listing of the public front, in the 375 vocabulary.
 *
 * A sealed two-column frame on desktop: the hero is pinned on the left while
 * the project rows scroll infinitely — the track carries three identical
 * copies so the scroller keeps to the middle one and loops seamlessly, both up
 * and down — on the right. The filter is a `Filtrer +` toggle that drops a
 * vertical category list, and the loop is rebuilt from the filtered set. The
 * columns stack, rows move their titles below the images and the list returns
 * to normal document flow on smaller screens. It owns the loop, the filter and
 * the WebGL deformation, so the page only resolves content and hrefs.
 *
 * @example
 * <ProjectsShowcase kicker={`${appName} — Projets`} title={<>Des projets pensés pour <em>tenir</em> leurs promesses.</>} lede="Du site vitrine au e-commerce…" projects={entries} />
 */
export function ProjectsShowcase(props: ProjectsShowcaseProps) {
	const { kicker, title, lede, projects, allLabel = 'Tout' } = props;
	const titleRef = useRef<HTMLHeadingElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<HTMLElement>(null);
	const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
	const [filterOpen, setFilterOpen] = useState(false);
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const query = window.matchMedia(DESKTOP_BREAKPOINT);
		setIsDesktop(query.matches);

		const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);

	const categories = [ALL_CATEGORY, ...Array.from(new Set(projects.map((project) => project.rubrique)))];
	const visibleProjects =
		activeCategory === ALL_CATEGORY ? projects : projects.filter((project) => project.rubrique === activeCategory);

	const loopProjects = isDesktop ? [...visibleProjects, ...visibleProjects, ...visibleProjects] : visibleProjects;
	const filterKey = `${activeCategory}:${isDesktop}`;

	useTextRise(titleRef, { delay: 0.6, from: 'start' });
	useProjectsList(listRef, frameRef, isDesktop, filterKey);
	useProjectDistortion(frameRef, listRef, isDesktop, filterKey);

	const filterLabel = (category: string) => (category === ALL_CATEGORY ? allLabel : category);

	return (
		<section
			ref={frameRef}
			className="projects__frame relative z-1 bg-noir lg:grid lg:h-dvh lg:grid-cols-[3fr_2fr] lg:overflow-hidden"
		>
			<div className="projects__info flex flex-col justify-end px-6 py-12 md:px-12 lg:px-16 lg:py-16 lg:pt-28 lg:pb-32">
				<Kicker>{kicker}</Kicker>
				<div className="mt-8">
					<Heading level={1} ref={titleRef}>
						{title}
					</Heading>
				</div>

				{isDesktop && (
					<div className="projects__info-field relative min-h-0 flex-1" aria-hidden="true">
						<AmbientField />
					</div>
				)}

				<div className="projects__bottom mt-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-10 border-t border-white/10 pt-8">
					<Paragraph className="max-w-160">{lede}</Paragraph>

					<div className="projects__filter relative">
						<div
							className={
								'projects__filter-list pointer-events-none absolute top-full left-0 z-10 mt-3 grid min-w-44 gap-1 border border-ink-inverted/15 bg-canvas p-2 opacity-0 shadow-xl transition-opacity duration-300 lg:bottom-full lg:top-auto lg:mb-3 lg:mt-0 ' +
								(filterOpen ? 'pointer-events-auto opacity-100' : '')
							}
							role="listbox"
							aria-label="Filtrer les projets"
						>
							{categories.map((category) => {
								const isActive = category === activeCategory;

								return (
									<button
										key={category}
										type="button"
										role="option"
										aria-selected={isActive}
										className={
											'projects__filter-option flex items-center gap-2 px-3 py-2 text-left font-news text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-ink-inverted ' +
											(isActive ? 'text-primary-soft' : 'text-ink-inverted/60')
										}
										onClick={() => {
											setActiveCategory(category);
											setFilterOpen(false);
										}}
									>
										<span
											className={
												'projects__filter-option-dot h-1.5 w-1.5 bg-primary-soft transition-opacity ' +
												(isActive ? 'opacity-100' : 'opacity-0')
											}
											aria-hidden="true"
										/>
										{filterLabel(category)}
									</button>
								);
							})}
						</div>
						<Button type="button" variant="secondary" fitContent onClick={() => setFilterOpen((open) => !open)}>
							Filtrer
							<span className={`transition-transform duration-300 ${filterOpen ? 'rotate-45' : ''}`} aria-hidden="true">
								+
							</span>
						</Button>
					</div>
				</div>
			</div>

			<div
				ref={listRef}
				className="projects__list px-6 pt-8 pb-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:px-10 lg:pt-16 lg:pb-10"
				data-projects-list
			>
				<div className="projects__track flex flex-col" data-projects-track>
					{loopProjects.map((project, i) => (
						<ProjectRow
							key={`${project.title}-${i}`}
							index={i % projects.length}
							title={project.title}
							coverFile={project.coverFile}
							href={project.href}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
