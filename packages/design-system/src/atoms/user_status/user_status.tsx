import { cn, tv, type VariantProps } from 'tailwind-variants';

const userStatus = tv({
	base: 'px-4 py-1 border rounded',
	variants: {
		status: {
			verified: 'text-success border-success/40 bg-success/15',
			unverified: 'text-danger border-danger/40 bg-danger/15',
			pending_invite: 'text-primary-soft border-primary-soft/40 bg-primary-soft/15',
		},
	},
	defaultVariants: {
		status: 'unverified',
	},
});

export type UserStatusKind = NonNullable<VariantProps<typeof userStatus>['status']>;

interface UserStatusProps {
	/**
	 * The user's current account status.
	 *
	 * - `'verified'` — success colors (green tones).
	 * - `'unverified'` — danger colors (red tones).
	 * - `'pending_invite'` — secondary colors (invitation not yet accepted).
	 */
	status: UserStatusKind;
	/**
	 * Visible label text. The caller resolves it (e.g. from translations),
	 * keeping the component free of i18n machinery.
	 */
	label: string;
	/** Additional Tailwind classes. */
	className?: string;
}

/**
 * Displays a color-coded status badge for a user account.
 *
 * Maps each {@link UserStatusKind} value to a distinct visual style using
 * the design system's semantic color tokens. The label text is injected by
 * the caller so the badge adapts to whatever locale the app is rendering in.
 *
 * @example
 * <UserStatus status="verified" label={t('status.verified')} />
 */
export function UserStatus(props: UserStatusProps) {
	const { status, label, className } = props;

	return <span className={cn(userStatus({ status }), className)}>{label}</span>;
}
