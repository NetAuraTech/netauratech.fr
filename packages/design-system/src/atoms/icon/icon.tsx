import { Icon as IconifyIcon } from '@iconify/react';
import { cn, tv } from 'tailwind-variants';

// The icon carries no base styling of its own — it is a pure pass-through to
// the Iconify element — but routes its `className` through `tv` so the
// component keeps the package's standard class-merging behaviour.
const icon = tv({
	base: '',
});

interface IconProps {
	/**
	 * Icon identifier. Either a full Iconify name (`'lucide:arrow-left'`) or a
	 * bare PascalCase name (`'ArrowLeft'`), which resolves to the Lucide set.
	 */
	name: string;
	/** Icon size in pixels. */
	size?: number;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Converts PascalCase to kebab-case for Iconify compatibility.
 */
function toKebabCase(str: string) {
	return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Icon component using Iconify for dynamic loading.
 *
 * Pass a PascalCase name (e.g. `<Icon name="ArrowLeft" />`) to render a Lucide
 * icon, or a full Iconify identifier (e.g. `<Icon name="mdi:github" />`) to
 * render any icon from any Iconify set. Icons are loaded on-demand from
 * Iconify without a local map/dictionary.
 *
 * @example
 * <Icon name="ArrowLeft" size={20} className="text-ink-muted" />
 */
export function Icon(props: IconProps) {
	const { name, size, className, ...iconProps } = props;

	const iconName = name.includes(':') ? name : `lucide:${toKebabCase(name)}`;

	return (
		<IconifyIcon icon={iconName} width={size} height={size} className={cn(icon(), className)} {...(iconProps as any)} />
	);
}
