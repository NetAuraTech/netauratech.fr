import { cn, tv } from 'tailwind-variants';

const avatar = tv({
	base: 'w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-sm font-semibold text-ink-muted group-hover:bg-secondary group-hover:text-ink-inverted transition',
});

interface AvatarProps {
	/** The user's display name. Its initials are rendered inside the circle. */
	username: string;
	/** Whether to display the username next to the avatar. Defaults to `false`. */
	showUsername?: boolean;
	/** Additional Tailwind classes merged onto the circle. */
	className?: string;
}

/**
 * Generates avatar initials from a full name.
 *
 * Extracts the first letter of each word, capped at 2 characters,
 * and uppercases the result.
 *
 * @param username - The full name to generate initials from.
 * @returns A 1 or 2 character uppercase string.
 *
 * @example
 * getAvatarInitials('John Doe')        // 'JD'
 * getAvatarInitials('Alice')           // 'A'
 * getAvatarInitials('Jean-Pierre Doe') // 'JP'
 */
export function getAvatarInitials(username: string): string {
	return username
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0].toUpperCase())
		.join('');
}

/**
 * Displays a user's avatar.
 *
 * Renders a circular placeholder with the user's initials until a proper
 * avatar image is available. When `showUsername` is enabled the username is
 * shown to the right of the circle. The data is injected by the caller —
 * the component never decides which user to show.
 *
 * Hover states (secondary background, secondary text) are driven by a CSS `group`
 * — wrap this component in a `group` element to activate them.
 *
 * @example
 * // Initials only
 * <Avatar username="Alice Martin" />
 *
 * // With username, inside a group for hover effects
 * <div className="group">
 *   <Avatar username="Alice Martin" showUsername />
 * </div>
 */
export function Avatar(props: AvatarProps) {
	const { username, showUsername = false, className } = props;

	return (
		<div className="group flex gap-4 items-center">
			<div className={cn(avatar(), className)}>{getAvatarInitials(username)}</div>
			{showUsername && <span className="text-ink group-hover:text-secondary transition">{username}</span>}
		</div>
	);
}
