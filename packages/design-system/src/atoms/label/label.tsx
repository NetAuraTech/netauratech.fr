import { cn, tv } from 'tailwind-variants';

const labelStyles = tv({
	base: 'text-ink font-bold',
});

interface LabelProps {
	/** The visible text content of the label. */
	label: string;
	/** Must match the `name`/`id` of the associated input element. */
	htmlFor: string;
	/** When `true`, appends a red asterisk (`*`) to signal a required field. */
	required?: boolean;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Accessible form label.
 *
 * Renders a `<label>` element associated with a form control via `htmlFor`.
 * When `required` is set a danger-colored asterisk is appended — this is a
 * visual hint only and does not replace the `required` attribute on the input
 * itself.
 *
 * @example
 * <Label htmlFor="email" label="Email address" required />
 * <Input name="email" type="email" required />
 */
export function Label(props: LabelProps) {
	const { label, htmlFor, required, className } = props;

	return (
		<label htmlFor={htmlFor} className={cn(labelStyles(), className)}>
			{label}
			{required && <span className="ml-1 text-danger">*</span>}
		</label>
	);
}
