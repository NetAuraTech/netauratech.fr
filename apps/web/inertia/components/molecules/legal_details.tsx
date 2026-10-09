import { Fragment } from 'react';
import type { ReactNode } from 'react';

interface LegalDetailRow {
	/** Uppercase tracked label, e.g. `'Adresse'`. */
	label: string;
	/** Row value; may carry links or other markup. */
	value: ReactNode;
}

interface LegalDetailsProps {
	/** Ordered label/value rows, e.g. the editor's identity. */
	rows: LegalDetailRow[];
}

/**
 * Label/value definition list for legal identity blocks.
 *
 * Renders the two-column grid of uppercase tracked labels and their values used
 * by the editor and data-controller identity sections of the legal pages.
 *
 * @example
 * <LegalDetails
 *   rows={[
 *     { label: 'Nom', value: 'Acme SARL' },
 *     { label: 'Adresse', value: '1 rue du Commerce, Lille' },
 *   ]}
 * />
 */
export function LegalDetails(props: LegalDetailsProps) {
	const { rows } = props;

	return (
		<dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[13rem_1fr]">
			{rows.map((row) => (
				<Fragment key={row.label}>
					<dt className="font-news text-[11px] uppercase leading-7 tracking-[0.3em] text-ink-inverted/50">
						{row.label}
					</dt>
					<dd className="leading-7 text-ink-inverted/80">{row.value}</dd>
				</Fragment>
			))}
		</dl>
	);
}
