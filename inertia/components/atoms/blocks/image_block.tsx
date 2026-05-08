import type { ResolvedBlock } from '#types/page'

interface ImageBlockProps {
  block: ResolvedBlock<'image'>
  isPriority?: boolean
}

/**
 * Renders a single resolved image with optional caption.
 * When `fullWidth` is true the image stretches to fill its container;
 * otherwise it uses `width: auto` with a max-width constraint.
 */
export default function ImageBlock({ block, isPriority = false }: ImageBlockProps) {
  const { file, className } = block.props

  if (!file) return null

  const srcset = file.variants
    ? Object.entries(file.variants)
        .map(([width, url]) => `${url} ${width}w`)
        .join(', ')
    : undefined

  const width = file.width ?? 800
  const height = file.height ?? 600

  return (
    <img
      src={file.url}
      srcSet={srcset}
      sizes="(max-width: 768px) 100vw, 50vw"
      alt={file.alt}
      width={width}
      height={height}
      loading={isPriority ? 'eager' : 'lazy'}
      fetchPriority={isPriority ? 'high' : 'auto'}
      className={[className].filter(Boolean).join(' ')}
    />
  )
}
