import type { BaseFontSize, FontSize, SingleFontSize } from '#types/font';

/**
 * Converts a {@link FontSize} value into a space-separated Tailwind class string.
 *
 * When an array is provided each element is converted individually and the
 * results are joined with a space, allowing multiple breakpoint variants to
 * be expressed as a single prop.
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
