import type { ImgHTMLAttributes } from 'react'
import type { ResolvedFile } from '#types/file'

interface FileImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'alt'
> {
  file: ResolvedFile
}

/**
 * Renders a server-resolved file prop as a responsive `<img>`.
 *
 * Accepts the `ResolvedFile` prop produced by `FindFileAction` (or the
 * `FileTransformer` with a display intent) plus any standard `<img>` attribute.
 * Builds the `srcset` from the file's responsive variants and renders the
 * resolved alt. No fetching, no state — fully SSR-friendly.
 *
 * Intended for images only; other file types are rendered directly from the
 * same prop (e.g. a download link).
 *
 * @example
 * <FileImage file={hero} alt="" className="rounded" />
 */
export default function FileImage({ file, className, ...imgProps }: FileImageProps) {
  const srcset = file.variants
    ? Object.entries(file.variants)
        .map(([width, url]) => `${url} ${width}w`)
        .join(', ')
    : undefined

  return (
    <img
      src={file.url}
      srcSet={srcset}
      alt={file.alt}
      width={file.width ?? 800}
      height={file.height ?? 600}
      className={className}
      {...imgProps}
    />
  )
}
