/**
 * Environment shim for the jsdom page specs. The design system's motion hooks
 * read `window.matchMedia('(prefers-reduced-motion: reduce)')` directly (see
 * `packages/design-system/src/shared/*` and `atoms/button/use_button_text.ts`),
 * but jsdom does not implement `matchMedia`. Stub it to report "motion
 * allowed" so the specs exercise the component render path without the
 * animation (which they never assert on). Node-environment helper specs never
 * touch `window`, so the guard makes this a no-op there.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}),
	});
}
