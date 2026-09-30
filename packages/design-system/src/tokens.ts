/**
 * Presentation tokens for the design system.
 *
 * These are the shared type surface for typography and paragraph presentation.
 * They live in the design-system package so every consumer (and Storybook)
 * shares a single definition, rather than each app keeping its own copy.
 */

/**
 * Base Tailwind font-size scale, mapping directly to the `text-*` utilities.
 */
export type BaseFontSize =
	| 'xs'
	| 'sm'
	| 'base'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl'
	| '4xl'
	| '5xl'
	| '6xl'
	| '7xl'
	| '8xl'
	| '9xl';

/**
 * A font size that can optionally be scoped to a Tailwind responsive breakpoint.
 *
 * Examples: `'base'`, `'lg'`, `'md:xl'`, `'lg:2xl'`
 */
export type SingleFontSize =
	| BaseFontSize
	| `sm:${BaseFontSize}`
	| `md:${BaseFontSize}`
	| `lg:${BaseFontSize}`
	| `xl:${BaseFontSize}`
	| `2xl:${BaseFontSize}`;

/**
 * Accepted value for the `fs` prop on typography components.
 *
 * Accepts either a single responsive size or an array of sizes that are
 * joined into a space-separated class string, allowing multiple breakpoint
 * overrides to be expressed declaratively.
 *
 * @example
 * // Single size
 * fs="lg"
 *
 * // Responsive array
 * fs={['base', 'md:lg', 'xl:xl']}
 */
export type FontSize = SingleFontSize | SingleFontSize[];

/**
 * Color variants accepted by paragraph components.
 */
export type ParagraphVariants =
	| 'ink'
	| 'ink-inverted'
	| 'muted'
	| 'subtle'
	| 'error'
	| 'primary'
	| 'primary-deep'
	| 'primary-soft'
	| 'primary-light'
	| 'secondary'
	| 'secondary-deep'
	| 'secondary-soft'
	| 'secondary-light'
	| 'tertiary'
	| 'tertiary-deep'
	| 'tertiary-soft'
	| 'tertiary-light';

/**
 * Vertical spacing scale accepted by paragraph components.
 */
export type ParagraphSpacing = 'xs' | 'sm' | 'base' | 'xl';

/**
 * Converts a {@link FontSize} value into a space-separated Tailwind class string.
 *
 * When an array is provided each element is converted individually and the
 * results are joined with a space, allowing multiple breakpoint variants to be
 * expressed as a single prop.
 *
 * @param size - A single responsive size or an array of sizes.
 * @returns A Tailwind class string (e.g. `'text-base'`, `'text-base md:text-lg'`).
 *
 * @example
 * getFontSizeClass('lg')                        // 'text-lg'
 * getFontSizeClass(['base', 'md:lg', 'xl:xl'])  // 'text-base md:text-lg xl:text-xl'
 */
export const getFontSizeClass = (size: FontSize): string => {
	if (Array.isArray(size)) {
		return size.map((s) => convertSingleSize(s)).join(' ');
	}

	return convertSingleSize(size);
};

/**
 * Converts a single {@link SingleFontSize} token into its Tailwind class equivalent.
 *
 * Breakpoint-prefixed tokens (e.g. `'md:xl'`) are split on `:` and
 * reassembled as `<breakpoint>:text-<size>`. Plain tokens are prefixed with
 * `text-` directly.
 *
 * @param size - A single size token, optionally prefixed with a breakpoint.
 * @returns The corresponding Tailwind utility class string.
 *
 * @example
 * convertSingleSize('base')   // 'text-base'
 * convertSingleSize('md:xl')  // 'md:text-xl'
 */
export const convertSingleSize = (size: SingleFontSize): string => {
	if (size.includes(':')) {
		const [breakpoint, textSize] = size.split(':') as [string, BaseFontSize];
		return `${breakpoint}:text-${textSize}`;
	}

	return `text-${size}`;
};

/**
 * A minimal, render-ready image source.
 *
 * Structural on purpose: any object exposing these members (e.g. a
 * server-resolved file prop) is accepted, so consumers can pass their own
 * richer file types without the design system importing an app type.
 */
export interface ImageSource {
	/** URL of the largest renderable image. */
	url: string;
	/** Accessible alt text. */
	alt?: string;
	/** Intrinsic width in pixels, used for aspect-ratio sizing. */
	width?: number;
	/** Intrinsic height in pixels, used for aspect-ratio sizing. */
	height?: number;
	/**
	 * Responsive variants, keyed by their width in pixels and mapped to their
	 * URL. Used to build the `srcset` attribute; omit for a single-size image.
	 */
	variants?: Record<string | number, string>;
}

/**
 * Builds a `srcset` attribute string from an {@link ImageSource}'s variants.
 *
 * @param source - The image source whose `variants` are turned into a
 *                 comma-separated `url widthw` list.
 * @returns The `srcset` string, or `undefined` when the source has no variants.
 *
 * @example
 * buildSrcSet({ url: '/a.jpg', variants: { 800: '/a-800.jpg', 1600: '/a-1600.jpg' } })
 * // '/a-800.jpg 800w, /a-1600.jpg 1600w'
 */
export const buildSrcSet = (source: ImageSource): string | undefined => {
	if (!source.variants) {
		return undefined;
	}

	return Object.entries(source.variants)
		.map(([width, url]) => `${url} ${width}w`)
		.join(', ');
};

/**
 * One figure of a gallery: an optional resolved image plus an optional alt
 * override. When `file` is absent the figure renders as a placeholder, so
 * unresolved references degrade gracefully instead of failing.
 */
export type GalleryFigure = {
	/** The resolved image; when absent the figure renders a placeholder. */
	file?: ImageSource;
	/** Alt text override, shown in captions and screen readers. */
	alt?: string;
};

/**
 * A bold-led feature blurb, rendered as a kicker above a short body.
 */
export interface ProjectFeature {
	/** Leading label (rendered as a kicker). */
	label: string;
	/** Markdown body following the label. */
	body: string;
}

/**
 * One renderable block of a project's editorial story.
 *
 * The story alternates freeform markdown (`lede`, `chapter`) with typed
 * blocks (`features`, `quote`, `gallery`, `metrics`), each rendered with its
 * own layout.
 */
export type ProjectBlock =
	| { type: 'lede'; body: string }
	| { type: 'chapter'; title: string; body: string }
	| { type: 'features'; items: ProjectFeature[] }
	| { type: 'quote'; quote: string; attribution?: string }
	| { type: 'gallery'; images: GalleryFigure[] }
	| { type: 'metrics'; items: string[] };

/**
 * A service offer, structurally identical to the app's `SiteService`.
 *
 * Structural on purpose: the app passes its own content type without the design
 * system importing an app type. `description` is markdown.
 */
export interface ServiceOffer {
	/** Service name, e.g. `'Sites vitrines'`. */
	rubrique: string;
	/** Discrete items describing the service. */
	items: string[];
	/** Long-form markdown body. */
	description: string;
	/** The `Inclus` fact, when present. */
	inclus?: string;
	/** The `Tarif` fact, when present. */
	tarif?: string;
}
