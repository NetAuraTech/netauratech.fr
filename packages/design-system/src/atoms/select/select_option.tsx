interface SelectOptionProps {
	/** The visible text displayed in the dropdown. */
	label: string;
	/** The value submitted with the form. Use `''` for placeholder options. */
	value?: string | number;
}

/**
 * A single `<option>` element for use inside `<Select>`.
 *
 * @example
 * <Select name="status">
 *   <SelectOption value="active" label="Active" />
 *   <SelectOption value="inactive" label="Inactive" />
 * </Select>
 */
export function SelectOption(props: SelectOptionProps) {
	const { label, value } = props;

	return <option value={value}>{label}</option>;
}
