import { ReactNode } from 'react';
import { useAuth } from '~/hooks/use_auth';

interface AuthenticatedProps {
	fallback?: ReactNode;
	children: ReactNode;
}

/**
 * Conditionally renders children based on the user's authentication status.
 *
 * @param fallback - Content to render when the user is unauthenticated. Defaults to `null`
 * @param children - Content to render when the user is authenticated
 *
 * @example
 * // Basic usage
 * <Authenticated>
 *   <UserMenu />
 * </Authenticated>
 *
 * @example
 * // With fallback
 * <Authenticated fallback={<LoginButton />}>
 *   <UserDashboard />
 * </Authenticated>
 */
export function Authenticated({ fallback = null, children }: AuthenticatedProps) {
	const { isAuthenticated } = useAuth();

	return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}
