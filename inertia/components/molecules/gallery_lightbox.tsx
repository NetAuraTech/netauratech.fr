import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import FileImage from '~/components/atoms/file_image'
import type { ProjectGalleryImage } from '#types/site_content'

interface GalleryLightboxProps {
  /** Project title, used in the overlay label and caption fallback. */
  title: string
  /** Project category, shown in the caption fallback. */
  rubrique: string
  /** Ordered figures of the gallery, cycled infinitely. */
  figures: ProjectGalleryImage[]
  /** Index of the figure opened on arrival. */
  initialIndex: number
  /** Called when the overlay is dismissed. */
  onClose: () => void
}

/** Fullscreen placeholder dimensions (16:10). */
const LIGHTBOX_W = 1920
const LIGHTBOX_H = 1200

/**
 * Fullscreen gallery lightbox of a project's figures.
 *
 * Rendered in a portal over the whole page: the current figure centered on the
 * atelier's near-black surface. Closed by Escape, a backdrop click or the
 * corner close button; navigated with the arrows or the keyboard — the gallery
 * cycles infinitely, the last figure reaching the first and vice versa. The
 * body scroll is locked while it is open, and the figure fades in again each
 * time the index moves.
 *
 * @example
 * <GalleryLightbox title="AdonisJS Foundry" rubrique="Application web" figures={[{ fileId: 3 }]} initialIndex={0} onClose={() => {}} />
 */
export function GalleryLightbox(props: GalleryLightboxProps) {
  const { title, rubrique, figures, initialIndex, onClose } = props
  const total = figures.length
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowRight') {
        setCurrent((index) => (index + 1) % total)
        return
      }
      if (event.key === 'ArrowLeft') {
        setCurrent((index) => (index - 1 + total) % total)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [total, onClose])

  const figure = figures[Math.min(current, total - 1)]
  const label = String(current + 1).padStart(2, '0')

  return createPortal(
    <div
      className="gallery__lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — galerie`}
    >
      <button
        type="button"
        className="gallery__lightbox-stage"
        onClick={onClose}
        aria-label="Fermer le plein écran"
      />

      <div key={current} className="contents">
        {'file' in figure ? (
          <FileImage
            file={figure.file}
            original
            width={figure.file.width ?? LIGHTBOX_W}
            height={figure.file.height ?? LIGHTBOX_H}
            className="gallery__lightbox-photo"
          />
        ) : (
          <div className="gallery__lightbox-photo bg-[#0b0b0d]" aria-hidden="true" />
        )}
      </div>

      <button
        type="button"
        className="gallery__lightbox-arrow gallery__lightbox-arrow-prev"
        onClick={() => setCurrent((index) => (index - 1 + total) % total)}
        aria-label="Image précédente"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        className="gallery__lightbox-arrow gallery__lightbox-arrow-next"
        onClick={() => setCurrent((index) => (index + 1) % total)}
        aria-label="Image suivante"
      >
        <span aria-hidden="true">→</span>
      </button>

      <button
        type="button"
        className="gallery__lightbox-close"
        onClick={onClose}
        aria-label="Fermer"
      >
        Fermer <span aria-hidden="true">✕</span>
      </button>

      <p className="gallery__lightbox-counter" aria-hidden="true">
        Fig. {label} / {String(total).padStart(2, '0')}
      </p>
      <p className="gallery__lightbox-caption">
        {'file' in figure ? figure.file.alt : (figure.alt ?? `${title} — ${rubrique}`)}
      </p>
    </div>,
    document.body
  )
}
