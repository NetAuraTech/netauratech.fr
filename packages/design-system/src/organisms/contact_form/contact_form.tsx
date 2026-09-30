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
	 * Recipient address of the mailto form. Injected by the caller (e.g. from
	 * the shared props) — the form resolves no app data itself.
	 */
	email: string;
}

/**
 * Closing contact section shared by every public front page.
 *
 * The hairline-topped `#contact` section: a Contact header (with its own
 * scroll-sweep animation) and the mailto form — name, email, optional Service
 * selector, and the project message. Submissions go out by email; nothing is
 * written to the database.
 *
 * @example
 * <ContactForm title={<>Prêt à lancer votre projet <em>sur mesure</em> ?</>} email="contact@exemple.fr" />
 */
export function ContactForm(props: ContactFormProps) {
	const { title, index = '02', email } = props;

	return (
		<Section id="contact" variant="front" className="overflow-x-clip border-t border-white/10 py-28 md:py-40">
			<SectionHeader kicker="Contact" index={index}>
				{title}
			</SectionHeader>
			<form
				className="mt-12 text-left"
				action={`mailto:${email}?subject=Projet%20web`}
				method="post"
				encType="text/plain"
			>
				<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
					<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
						01
					</span>
					<Field label="Nom" name="name" type="text" placeholder="Votre nom" required />
				</div>
				<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
					<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
						02
					</span>
					<Field label="Email" name="email" type="email" placeholder="vous@exemple.fr" required />
				</div>
				<div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-1 border-t border-ink-inverted/12 py-5">
					<span className="text-xs tracking-[0.2em] text-primary-soft" aria-hidden="true">
						03
					</span>
					<Field label="Service" name="service" type="select" placeholder="Choisir…">
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
					/>
				</div>
				<Button type="submit" variant="primary" fitContent>
					Envoyer la demande
				</Button>
			</form>
		</Section>
	);
}
