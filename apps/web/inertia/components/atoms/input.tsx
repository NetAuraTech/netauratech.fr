import { ChangeEvent, ReactNode } from 'react';

interface InputProps {
	/** The `name` and `id` attribute of the underlying `<input>`. */
	name: string;
	/** HTML input type (e.g. `'text'`, `'email'`, `'password'`). */
	type: string;
	placeholder?: string;
	defaultValue?: string | number;
	disabled?: boolean;
	required?: boolean;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (event?: ChangeEvent<HTMLInputElement>) => void;
	children?: ReactNode;
}

/**
 * Base text input component.
 *
 * Applies the `input` utility class from the design system, which covers the
 * boxed editorial style: transparent background, full hairline border, light
 * text (`text-ink-inverted`), placeholder color, disabled state and a purple
 * focus border. Inside a `<Card>` the utility flips to the light-surface look
 * (`text-ink`, `border-edge`).
 *
 * The `name` prop is used for both `name` and `id` so that a sibling
 * `<Label>` with the matching `htmlFor` associates correctly.
 *
 * For multi-line input use `<Textarea>`. For select inputs use `<Select>`.
 *
 * @example
 * <Input name="email" type="email" placeholder="you@example.com" required />
 */
export function Input(props: InputProps) {
	const { name, type, placeholder, defaultValue, disabled, required, onChange, onBlur, children, ...inputProps } =
		props;

	return (
		<input
			type={type}
			name={name}
			id={name}
			placeholder={placeholder}
			defaultValue={defaultValue}
			disabled={disabled}
			required={required}
			onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
			onBlur={onBlur}
			className="front-input"
			{...inputProps}
		/>
	);
}
