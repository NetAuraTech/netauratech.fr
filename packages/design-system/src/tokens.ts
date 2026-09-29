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
 * Breakpoint-prefixed tokens (e.g. `'md:lg'`) are split on `:` and
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
