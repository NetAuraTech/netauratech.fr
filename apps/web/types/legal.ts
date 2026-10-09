/**
 * Identity of the site publisher (éditeur / responsable du traitement),
 * displayed on the legal notices and privacy pages.
 *
 * Resolved server-side from the `LEGAL_*` environment variables (see
 * `config/legal.ts`); the shape is shared with the Inertia pages, which may
 * not import backend modules.
 */
export interface LegalIdentity {
	/** Legal name of the publisher. */
	name: string;
	/** Legal form and registered capital, e.g. "SAS au capital de 10 000 €". */
	status: string;
	/** Head-office address. */
	address: string;
	/** SIRET number. */
	siret: string;
	/** Name of the publication director. */
	publicationDirector: string;
}
