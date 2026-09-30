import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image } from '../../atoms/image/image';
import type { GalleryFigure } from '../../tokens';

interface GalleryLightboxProps {
	/** Project title, used in the overlay label and caption fallback. */
	title: string;
	/** Project category, shown in the caption fallback. */
	rubrique: string;
	/** Ordered figures of the gallery, cycled infinitely. */
	figures: GalleryFigure[];
	/** Index of the figure opened on arrival. */
	initialIndex: number;
	/** Called when the overlay is dismissed. */
	onClose: () => void;
}

/** Fullscreen placeholder dimensions (16:10). */
const LIGHTBOX_W = 1920;
const LIGHTBOX_H = 1200;

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
 * <GalleryLightbox title="AdonisJS Foundry" rubrique="Application web" figures={[{ file: { url: '/a.jpg' } }]} initialIndex={0} onClose={() => {}} />
 */
export function GalleryLightbox(props: GalleryLightboxProps) {
	const { title, rubrique, figures, initialIndex, onClose } = props;
	const total = figures.length;
	const [current, setCurrent] = useState(initialIndex);

	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
				return;
			}
			if (event.key === 'ArrowRight') {
				setCurrent((index) => (index + 1) % total);
				return;
			}
			if (event.key === 'ArrowLeft') {
				setCurrent((index) => (index - 1 + total) % total);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [total, onClose]);

	const figure = figures[Math.min(current, total - 1)];
	const label = String(current + 1).padStart(2, '0');

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={`${title} — galerie`}
			className="fixed inset-0 z-50 flex items-center justify-center bg-noir/95 text-ink-inverted motion-safe:animate-fade-in"
		>
			<button
				type="button"
				onClick={onClose}
				aria-label="Fermer le plein écran"
				className="absolute inset-0 cursor-zoom-out"
			/>

			<div key={current} className="contents">
				{figure.file ? (
					<Image
						source={figure.file}
						original
						width={figure.file.width ?? LIGHTBOX_W}
						height={figure.file.height ?? LIGHTBOX_H}
						className="relative z-10 max-h-[82vh] max-w-[90vw] object-contain motion-safe:animate-fade-in"
					/>
				) : (
					<div className="relative z-10 max-h-[82vh] max-w-[90vw] bg-noir" aria-hidden="true" />
				)}
			</div>

			<button
				type="button"
				onClick={() => setCurrent((index) => (index - 1 + total) % total)}
				aria-label="Image précédente"
				className="absolute left-2 top-1/2 z-20 -translate-y-1/2 p-4 font-news text-4xl leading-none text-ink-inverted/50 transition-colors hover:text-primary-soft md:left-6 md:text-5xl"
			>
				<span aria-hidden="true">←</span>
			</button>
			<button
				type="button"
				onClick={() => setCurrent((index) => (index + 1) % total)}
				aria-label="Image suivante"
				className="absolute right-2 top-1/2 z-20 -translate-y-1/2 p-4 font-news text-4xl leading-none text-ink-inverted/50 transition-colors hover:text-primary-soft md:right-6 md:text-5xl"
			>
				<span aria-hidden="true">→</span>
			</button>

			<button
				type="button"
				onClick={onClose}
				aria-label="Fermer"
				className="absolute right-4 top-4 z-20 flex items-center gap-3 font-news text-[11px] uppercase tracking-[0.25em] text-ink-inverted/60 transition-colors hover:text-ink-inverted"
			>
				Fermer{' '}
				<span aria-hidden="true" className="text-sm">
					✕
				</span>
			</button>

			<p
				className="absolute bottom-4 left-4 z-20 font-news text-[11px] tracking-[0.25em] text-primary-soft"
				aria-hidden="true"
			>
				Fig. {label} / {String(total).padStart(2, '0')}
			</p>
			<p className="absolute bottom-4 right-4 z-20 hidden max-w-md text-right font-news text-[11px] uppercase tracking-[0.25em] text-ink-inverted/40 md:block">
				{figure.file ? figure.file.alt : (figure.alt ?? `${title} — ${rubrique}`)}
			</p>
		</div>,
		document.body,
	);
}
