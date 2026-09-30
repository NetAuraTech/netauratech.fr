import { SharedProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import { ReactNode, useRef } from 'react';
import { Button } from '~/components/atoms/button';
import { Section } from '~/components/atoms/section';
import { SelectOption } from '~/components/atoms/select_option';
import { Field } from '~/components/molecules/field';
import { SectionHeader } from '~/components/molecules/section_header';
import { useTextSweep } from '~/hooks/animations/use_text_sweep';

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
}

/**
 * Closing contact section shared by every public front page.
 *
 * The hairline-topped `#contact` section: a Contact header (with its own
 * scroll-sweep animation) and the mailto form — name, email, optional Service
 * selector, and the project message. Submissions go out by email; nothing is
 * written to the database. The target address is read from the shared props.
 *
 * @example
 * <ContactForm title={<>Prêt à lancer votre projet <em>sur mesure</em> ?</>} />
 */
export function ContactForm(props: ContactFormProps) {
	const { title, index = '02' } = props;
	const { props: sharedProps } = usePage<SharedProps>();
	const { email } = sharedProps;
	const contactTitleRef = useRef<HTMLHeadingElement>(null);

	useTextSweep(contactTitleRef);

	return (
		<Section id="contact" className="overflow-x-clip border-t border-white/10 py-28 md:py-40">
			<SectionHeader kicker="Contact" index={index} titleRef={contactTitleRef}>
				{title}
			</SectionHeader>
			<form
				className="form"
				action={`mailto:${email}?subject=Projet%20web%20NetAuraTech`}
				method="post"
				encType="text/plain"
			>
				<div className="form__row">
					<span className="form__row-number" aria-hidden="true">
						01
					</span>
					<Field label="Nom" name="name" type="text" placeholder="Votre nom" required />
				</div>
				<div className="form__row">
					<span className="form__row-number" aria-hidden="true">
						02
					</span>
					<Field label="Email" name="email" type="email" placeholder="vous@exemple.fr" required />
				</div>
				<div className="form__row">
					<span className="form__row-number" aria-hidden="true">
						03
					</span>
					<Field label="Service" name="service" type="select" placeholder="Choisir…">
						<SelectOption value="sites-vitrines" label="Sites vitrines" />
						<SelectOption value="boutiques-en-ligne" label="Boutiques en ligne" />
						<SelectOption value="applications-web" label="Applications web" />
						<SelectOption value="autre" label="Autre" />
					</Field>
				</div>
				<div className="form__row">
					<span className="form__row-number" aria-hidden="true">
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
