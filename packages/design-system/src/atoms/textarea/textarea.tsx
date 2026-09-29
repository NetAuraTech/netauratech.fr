import { cn, tv } from 'tailwind-variants';
import type { ChangeEvent } from 'react';

const textarea = tv({
	base: 'textarea',
});

interface TextareaProps {
	/** The `name` and `id` attribute of the underlying `<textarea>`. */
	name: string;
	placeholder?: string;
	defaultValue?: string | number;
	/** Fixed column width. Rarely needed — prefer CSS sizing. */
	cols?: number;
	/** Number of visible text rows. Defaults to `4`. */
	rows?: number;
	disabled?: boolean;
	required?: boolean;
	onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
	onBlur?: (event?: ChangeEvent<HTMLTextAreaElement>) => void;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Styled multi-line text input.
 *
 * Applies the `textarea` utility class, which extends the `input` utility
 * with a minimum height and `field-sizing: content` so the element grows
 * with its content automatically.
 *
 * The `name` prop is used for both `name` and `id` so that a sibling
 * `<Label>` with the matching `htmlFor` associates correctly.
 *
 * @example
 * <Textarea name="message" placeholder="Write your message…" rows={6} required />
 */
export function Textarea(props: TextareaProps) {
	const {
		name,
		placeholder,
		defaultValue,
		cols,
		rows,
		disabled,
		required,
		onChange,
		onBlur,
		className,
		...textareaProps
	} = props;

	return (
		<textarea
			name={name}
			id={name}
			cols={cols}
			rows={rows || 4}
			placeholder={placeholder}
			defaultValue={defaultValue}
			disabled={disabled}
			required={required}
			onChange={onChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
			onBlur={onBlur}
			className={cn(textarea(), className)}
			{...textareaProps}
		/>
	);
}
