import { SharedProps } from '@adonisjs/inertia/types';
import { Head, usePage } from '@inertiajs/react';
import type { JsonLd } from '~/helpers/structured_data';

/**
 * The document head of one public front page.
 *
 * Centralizes the per-page SEO tags — document title, meta description, the
 * Open Graph / Twitter share image and the JSON-LD structured-data scripts —
 * so every front page emits the same contract. The site-wide chrome (canonical,
 * `og:url`, `og:site_name`, favicons, …) stays in the root layout; this
 * component only emits the page-level tags, never the layout ones.
 */
export function SeoHead(props: {
	/** The document title, e.g. `"Projets — Sites vitrines, e-commerce — NetAuraTech"`. */
	title: string;
	/** The meta description (≤ ~160 chars), also used as the share description. */
	description: string;
	/** Absolute URL of the share image; defaults to the static 512×512 brand icon. */
	image?: string;
	/** Width of a custom `image` in pixels (emitted only when provided). */
	imageWidth?: number;
	/** Height of a custom `image` in pixels (emitted only when provided). */
	imageHeight?: number;
	/** Structured-data nodes appended as `application/ld+json` scripts. */
	jsonLd?: JsonLd[];
}) {
	const { props: sharedProps } = usePage<SharedProps>();
	const { app_url } = sharedProps;

	const image = props.image ?? `${app_url}/web-app-manifest-512x512.png`;
	// The static brand image has known dimensions; a custom image only carries
	// them when the resolved file provides them.
	const isDefaultImage = !props.image;

	return (
		<Head>
			<title>{props.title}</title>
			<meta name="description" content={props.description} />
			<meta property="og:title" content={props.title} />
			<meta property="og:description" content={props.description} />
			<meta property="og:image" content={image} />
			{isDefaultImage && <meta property="og:image:width" content="512" />}
			{isDefaultImage && <meta property="og:image:height" content="512" />}
			{!isDefaultImage && props.imageWidth ? (
				<meta property="og:image:width" content={String(props.imageWidth)} />
			) : null}
			{!isDefaultImage && props.imageHeight ? (
				<meta property="og:image:height" content={String(props.imageHeight)} />
			) : null}
			<meta name="twitter:description" content={props.description} />
			<meta name="twitter:image" content={image} />
			{props.jsonLd?.map((node, index) => (
				<script key={index} type="application/ld+json">
					{JSON.stringify(node)}
				</script>
			))}
		</Head>
	);
}
