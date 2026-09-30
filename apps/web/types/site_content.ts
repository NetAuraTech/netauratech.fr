import type { ResolvedFile } from '#types/file';

/**
 * A service offer (glossary: `Service`) as parsed from its markdown source in
 * `content/services/`.
 */
export type SiteService = {
	/** Service name, e.g. `'Sites vitrines'`. */
	rubrique: string;
	/** Discrete items describing the service, e.g. `['Design sur mesure', 'SEO & performance']`. */
	items: string[];
	/** Long-form markdown body of the source file, minus the `Inclus`/`Tarif` fact lines. */
	description: string;
	/** Extracted content of the trailing `**Inclus**` fact line, when present. */
	inclus?: string;
	/** Extracted content of the trailing `**Tarif**` fact line, when present. */
	tarif?: string;
};

/**
 * A project (glossary: `Project`) as parsed from its markdown source in
 * `content/projects/`.
 */
export type SiteProject = {
	/** Content slug (source filename without `.md`), used for the `/projets/:slug` URL. */
	slug: string;
	/** Backend file id served as the project cover (plate and row images). */
	cover: number;
	/**
	 * The cover resolved against the backend file module, set server-side by the
	 * listing controllers before the Inertia view renders.
	 */
	coverFile?: ResolvedFile;
	/** Project category, e.g. `'Application web'`. */
	rubrique: string;
	/** Project title rendered on the plate. */
	title: string;
	/** One-line project description. */
	note: string;
	/** Ordered story blocks parsed from the source body. See `ProjectBlock`. */
	blocks: ProjectBlock[];
};

/**
 * One renderable block of a project's story.
 *
 * The project source stays a markdown file in `content/projects/{slug}.md`;
 * freeform markdown maps to a `lede` followed by `chapter` blocks (split on
 * `##` headings), and fenced regions — `:::type` / `:::` — insert typed blocks
 * (`features`, `quote`, `gallery`, `metrics`) that each render with their own
 * layout, freeing the single-page design from a single block of text.
 */
export type ProjectBlock =
	| { type: 'lede'; body: string }
	| { type: 'chapter'; title: string; body: string }
	| { type: 'features'; items: ProjectFeature[] }
	| { type: 'quote'; quote: string; attribution?: string }
	| { type: 'gallery'; images: ProjectGalleryImage[] }
	| { type: 'metrics'; items: string[] };

/** A bold-led feature blurb, lifted from a `features` block. */
export type ProjectFeature = {
	/** Leading label, e.g. `'Solidité'` (rendered as a kicker). */
	label: string;
	/** Markdown body following the label. */
	body: string;
};

/**
 * A gallery image referenced by its backend file id, resolved server-side by
 * the page controller and replaced by a `ProjectGalleryResolvedImage` before
 * the view renders.
 */
export type ProjectGalleryFileRef = {
	/** Id of the file served by the backend file module. */
	fileId: number;
	/** Optional alt text override applied at resolution time. */
	alt?: string;
};

/**
 * A gallery image already resolved against the backend file module, safe to
 * serialize into Inertia props (its alt is baked in server-side).
 */
export type ProjectGalleryResolvedImage = {
	/** The render-ready file, produced by the `FindFileAction`. */
	file: ResolvedFile;
};

/**
 * A gallery image: either a `fileId` reference to the backend file module
 * (resolved by the page controller) or the already-resolved `file` sent to
 * the Inertia view.
 */
export type ProjectGalleryImage = ProjectGalleryFileRef | ProjectGalleryResolvedImage;

/**
 * The content-backed data the hand-written front home page consumes.
 */
export type HomeContent = {
	services: SiteService[];
	projects: SiteProject[];
};
