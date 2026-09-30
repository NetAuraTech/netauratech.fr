import { buildSrcSet, type ImageSource } from '../../tokens';
import type { ImgHTMLAttributes } from 'react';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
	/**
	 * The resolved image source — URL, optional alt, intrinsic size and
	 * responsive variants. Any structurally-compatible object (e.g. a
	 * server-resolved file prop) is accepted.
	 */
	source: ImageSource;
	/** Render without the responsive srcset (e.g. fullscreen/zoom views). */
	original?: boolean;
}

/**
 * Renders a resolved image source as a responsive `<img>`.
 *
 * Builds the `srcset` from the source's responsive variants and renders the
 * resolved alt. No fetching, no state — fully SSR-friendly. Set `original` to
 * serve the untouched single-size image instead (no srcset), for zoom or
 * fullscreen displays. Any standard `<img>` attribute can be passed through.
 *
 * @example
 * <Image source={coverFile} className="rounded" />
 *
 * <Image source={coverFile} original className="object-contain" />
 */
export function Image({ source, original, className, ...imgProps }: ImageProps) {
	const srcset = original ? undefined : buildSrcSet(source);

	return (
		<img
			src={source.url}
			srcSet={srcset}
			alt={source.alt}
			width={source.width ?? 800}
			height={source.height ?? 600}
			className={className}
			{...imgProps}
		/>
	);
}
