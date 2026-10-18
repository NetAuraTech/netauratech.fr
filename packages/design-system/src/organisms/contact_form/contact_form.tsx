import { Form } from '@inertiajs/react';
import { Button } from '../../atoms/button/button';
import { Section } from '../../atoms/section/section';
import { SelectOption } from '../../atoms/select/select';
import { Field } from '../../molecules/field/field';
import { SectionHeader } from '../../molecules/section_header/section_header';
import type { ReactNode } from 'react';

interface ContactFormProps {
	/**
	 * Section title. An emphasized word may be wrapped in `<em>` — it is
	 * automatically italicized and colored with the accent, per the
	 * Italic-Accent rule.
	 */
	title: ReactNode;
	/**
	 * Zero-padded section index rendered on the right of the header row.
	 * Defaults to `'02'`.
	 */
	index?: string;
	/**
	 * URL of the server-side contact endpoint the form posts to. Injected by
	 * the caller (e.g. through `urlFor()`) — the form resolves no route itself
	 * and always submits with `POST`.
	 */
	action: string;
}

/**
 * Closing contact section shared by every public front page.
 *
 * The hairline-topped `#contact` section: a Contact header (with its own
 * scroll-sweep animation) and the form — name, email, optional Service
 * selector, and the project message. The form is an Inertia declarative
 * `<Form>` pinned to `POST`: the field values are read straight from the DOM
 * on submit and relayed to the injected server endpoint — nothing is written
 * to the database.
 *
 * The endpoint follows the app's standard form contract, so the `Form` needs
 * no custom callbacks: on success it flashes a message and redirects back —
 * the front layout toasts the flash and `resetOnSuccess` clears the fields —
 * and on validation failure the session middleware flashes the field errors
 * and redirects back, the shared `errors` prop carries them into this
 * `Form`'s render prop, and each `Field` displays its own entry under the
 * input.
 *
 * @example
 * <ContactForm
 *   title={<>Prêt à lancer votre projet <em>sur mesure</em> ?</>}
 *   action={urlFor('core.contact.execute')}
 * />
 */
export function ContactForm(props: ContactFormProps) {
	const { title, index = '02', action } = props;

	return (
		<Section id="contact" variant="front" className="overflow-x-clip border-t border-white/10 py-28 md:py-40">
			<SectionHeader kicker="Contact" index={index}>
				{title}
			</SectionHeader>
			<Form action={action} method="post" resetOnSuccess className="mt-12 text-left">
				{({ errors, processing }) => (
					<>
						<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
							<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
								01
							</span>
							<Field label="Nom" name="name" type="text" placeholder="Votre nom" required errors={errors} />
						</div>
						<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
							<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
								02
							</span>
							<Field label="Email" name="email" type="email" placeholder="vous@exemple.fr" required errors={errors} />
						</div>
						<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
							<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
								03
							</span>
							<Field label="Service" name="service" type="select" placeholder="Choisir…" errors={errors}>
								<SelectOption value="sites-vitrines" label="Sites vitrines" />
								<SelectOption value="boutiques-en-ligne" label="Boutiques en ligne" />
								<SelectOption value="applications-web" label="Applications web" />
								<SelectOption value="autre" label="Autre" />
							</Field>
						</div>
						<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
							<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
								04
							</span>
							<Field
								label="Votre projet"
								name="message"
								type="textarea"
								rows={4}
								placeholder="Parlez-nous de votre idée…"
								required
								errors={errors}
							/>
						</div>
						<Button type="submit" variant="primary" fitContent loading={processing}>
							Envoyer la demande
						</Button>
					</>
				)}
			</Form>
		</Section>
	);
}
