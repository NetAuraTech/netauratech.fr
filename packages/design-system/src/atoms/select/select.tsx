import { cn, tv } from 'tailwind-variants';
import { SelectOption } from './select_option';
import type { ChangeEvent, ReactNode } from 'react';

export { SelectOption } from './select_option';

const select = tv({
	base: 'select',
});

interface SelectProps {
	/** The `name` and `id` attribute of the underlying `<select>`. */
	name: string;
	type: string;
	/**
	 * When provided, prepends an empty `<option>` with this text.
	 * Useful as a default hint (e.g. `'Choose a role…'`).
	 */
	placeholder?: string;
	defaultValue?: string | number;
	disabled?: boolean;
	required?: boolean;
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
	onBlur?: (event?: ChangeEvent<HTMLSelectElement>) => void;
	/** `<SelectOption>` elements rendered as the select's option list. */
	children?: ReactNode;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Styled select input.
 *
 * Applies the `select` utility class from the design system, which inherits
 * all `input` styles (background, border, focus ring, etc.) and additionally
 * configures the native picker appearance.
 *
 * The `name` prop is used for both `name` and `id` so that a sibling
 * `<Label>` with the matching `htmlFor` associates correctly.
 *
 * Pass `<SelectOption>` components as `children` to populate the option list.
 * An optional `placeholder` prepends an unselectable hint option.
 *
 * @example
 * <Select name="role" placeholder="Choose a role…" required>
 *   <SelectOption value="admin" label="Administrator" />
 *   <SelectOption value="user" label="User" />
 * </Select>
 */
export function Select(props: SelectProps) {
	const {
		name,
		// `<select>` has no `type` attribute; accept it so `<Field type="select">`
		// can pass it through uniformly, but never render it onto the DOM element.
		type: _type,
		placeholder,
		defaultValue,
		disabled,
		required,
		onChange,
		onBlur,
		children,
		className,
		...selectProps
	} = props;

	return (
		<select
			name={name}
			id={name}
			defaultValue={defaultValue}
			disabled={disabled}
			required={required}
			onChange={onChange as (e: ChangeEvent<HTMLSelectElement>) => void}
			onBlur={onBlur}
			className={cn(select(), className)}
			{...selectProps}
		>
			{placeholder && <SelectOption value="" label={placeholder} />}
			{children}
		</select>
	);
}
