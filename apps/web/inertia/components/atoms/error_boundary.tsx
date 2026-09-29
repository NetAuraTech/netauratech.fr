import * as Sentry from '@sentry/react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
	/**
	 * The application subtree to guard.
	 */
	children: ReactNode;
	/**
	 * Fallback UI rendered when a descendant throws during render. Receives the
	 * error and a `reset` callback that re-renders the guarded subtree. Defaults
	 * to a bare alert when omitted.
	 */
	fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
	/**
	 * The last unhandled render error, or `null` while the tree is healthy.
	 */
	error: Error | null;
}

/**
 * React error boundary for the Inertia app.
 *
 * Catches render errors from the whole application subtree, reports them to
 * Sentry (with the React component stack as `extra`, no user data), and
 * renders a fallback instead of unmounting the app. Because Sentry capture is
 * a no-op while the client is uninitialized, the boundary is safe to mount in
 * environments where the DSN is unset.
 *
 * @example
 * createRoot(el).render(
 * 	<ErrorBoundary>
 * 		<App {...props} />
 * 	</ErrorBoundary>,
 * );
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	/**
	 * Moves the caught error into state so `render` can switch to the fallback.
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	/**
	 * Reports the unhandled render error to Sentry with the component stack.
	 */
	componentDidCatch(error: Error, info: ErrorInfo): void {
		Sentry.captureException(error, {
			extra: { componentStack: info.componentStack },
			tags: { source: 'react_error_boundary' },
		});
	}

	/**
	 * Clears the caught error so the guarded subtree gets another chance.
	 */
	private reset = (): void => {
		this.setState({ error: null });
	};

	/**
	 * Renders the fallback while an error is latched, otherwise the children.
	 */
	render(): ReactNode {
		const { error } = this.state;

		if (error) {
			if (this.props.fallback) {
				return this.props.fallback(error, this.reset);
			}

			return <div role="alert">Something went wrong.</div>;
		}

		return this.props.children;
	}
}
