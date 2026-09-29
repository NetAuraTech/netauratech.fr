import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import FileImage from './file_image';
import type { ResolvedFile } from '#types/file';

/**
 * Renders the server-resolved file prop into a responsive `<img>`: correct
 * `src`/`srcset` from the variants, the resolved alt, and pass-through of
 * standard image attributes. No fetching, no state.
 */
function makeFile(overrides: Partial<ResolvedFile> = {}): ResolvedFile {
	return {
		id: 1,
		url: 'https://cdn.example.com/hero.jpg',
		filename: 'hero.jpg',
		mimeType: 'image/jpeg',
		extension: 'jpg',
		size: 1024,
		type: 'image',
		alt: 'Hero image',
		width: 800,
		height: 600,
		variants: {
			400: 'https://cdn.example.com/hero-400.webp',
			800: 'https://cdn.example.com/hero-800.webp',
		},
		...overrides,
	};
}

describe('FileImage', () => {
	it('renders src and a responsive srcset from the variants', () => {
		const html = renderToStaticMarkup(createElement(FileImage, { file: makeFile() }));

		expect(html).toContain('src="https://cdn.example.com/hero.jpg"');
		expect(html).toContain(
			'srcSet="https://cdn.example.com/hero-400.webp 400w, https://cdn.example.com/hero-800.webp 800w"',
		);
	});

	it('renders the resolved alt', () => {
		const html = renderToStaticMarkup(createElement(FileImage, { file: makeFile() }));
		expect(html).toContain('alt="Hero image"');
	});

	it('passes through standard img attributes', () => {
		const html = renderToStaticMarkup(
			createElement(FileImage, {
				file: makeFile(),
				className: 'rounded',
				loading: 'eager',
				title: 'Hero',
			}),
		);

		expect(html).toContain('class="rounded"');
		expect(html).toContain('loading="eager"');
		expect(html).toContain('title="Hero"');
	});

	it('renders without srcset when variants are absent', () => {
		const html = renderToStaticMarkup(createElement(FileImage, { file: makeFile({ variants: undefined }) }));

		expect(html).toContain('src="https://cdn.example.com/hero.jpg"');
		expect(html).not.toContain('srcSet');
	});

	it('falls back to default dimensions when width/height are missing', () => {
		const html = renderToStaticMarkup(
			createElement(FileImage, { file: makeFile({ width: undefined, height: undefined }) }),
		);

		expect(html).toContain('width="800"');
		expect(html).toContain('height="600"');
	});
});
