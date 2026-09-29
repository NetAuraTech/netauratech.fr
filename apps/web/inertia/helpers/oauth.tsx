import type { OAuthProvider } from '#auth/types/auth';

/**
 * Returns the branded SVG icon for a given OAuth provider.
 *
 * Each icon uses the provider's official brand colors and is rendered as an
 * inline SVG so no external image assets or icon fonts are required. The
 * `size` parameter controls both `width` and `height` for square icons.
 *
 * Returns an empty fragment for unrecognised provider values so the call
 * site never needs to handle `null` or `undefined`.
 *
 * @param provider - The OAuth provider identifier (e.g. `'google'`, `'github'`).
 * @param size - Icon dimensions in pixels. Defaults to `32`.
 * @returns A JSX SVG element, or an empty fragment if the provider is unknown.
 *
 * @example
 * getIcon('google')       // 24×24 Google logo (default size)
 * getIcon('github', 20)   // 20×20 GitHub logo
 */
export const getIcon = (provider: OAuthProvider, size: number = 32) => {
	switch (provider) {
		case 'facebook':
			return (
				<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 666.667 666.667">
					<defs>
						<clipPath id="a" clipPathUnits="userSpaceOnUse">
							<path d="M0 700h700V0H0Z" />
						</clipPath>
					</defs>
					<g clip-path="url(#a)" transform="matrix(1.33333 0 0 -1.33333 -133.333 800)">
						<path
							d="M0 0c0 138.071-111.929 250-250 250S-500 138.071-500 0c0-117.245 80.715-215.622 189.606-242.638v166.242h-51.552V0h51.552v32.919c0 85.092 38.508 124.532 122.048 124.532 15.838 0 43.167-3.105 54.347-6.211V81.986c-5.901.621-16.149.932-28.882.932-40.993 0-56.832-15.528-56.832-55.9V0h81.659l-14.028-76.396h-67.631v-171.773C-95.927-233.218 0-127.818 0 0"
							style={{ fill: '#0866ff', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
							transform="translate(600 350)"
						/>
						<path
							d="m0 0 14.029 76.396H-67.63v27.019c0 40.372 15.838 55.899 56.831 55.899 12.733 0 22.981-.31 28.882-.931v69.253c-11.18 3.106-38.509 6.212-54.347 6.212-83.539 0-122.048-39.441-122.048-124.533V76.396h-51.552V0h51.552v-166.242a250.6 250.6 0 0 1 60.394-7.362c10.254 0 20.358.632 30.288 1.831V0Z"
							style={{ fill: '#fff', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
							transform="translate(447.918 273.604)"
						/>
					</g>
				</svg>
			);
		case 'github':
			return (
				<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 -3.1 2490.3 2493">
					<ellipse cx="1245.2" cy="1243.4" fill="#fff" rx="1217.6" ry="1246.5" />
					<path
						fill="#5c6bc0"
						d="M1245.2 1.6C557.6 1.6 0 559 0 1246.7c0 550.2 356.8 1016.9 851.5 1181.5 62.2 11.5 85.1-27 85.1-59.9 0-29.7-1.2-127.8-1.7-231.8-346.4 75.3-419.5-146.9-419.5-146.9-56.6-143.9-138.3-182.2-138.3-182.2-113-77.3 8.5-75.7 8.5-75.7 125 8.8 190.9 128.3 190.9 128.3 111.1 190.4 291.3 135.3 362.3 103.5 11.2-80.5 43.4-135.4 79.1-166.5-276.6-31.5-567.3-138.3-567.3-615.4 0-135.9 48.6-247 128.3-334.2C566 816.1 523.4 689.5 591 518c0 0 104.6-33.5 342.5 127.6 99.3-27.6 205.8-41.4 311.7-41.9 105.8.5 212.4 14.3 311.9 41.9C1794.8 484.5 1899.2 518 1899.2 518c67.8 171.5 25.1 298.2 12.2 329.5 79.8 87.2 128.1 198.3 128.1 334.2 0 478.2-291.3 583.6-568.6 614.4 44.7 38.6 84.5 114.4 84.5 230.6 0 166.6-1.4 300.7-1.4 341.7 0 33.1 22.4 72 85.5 59.7 494.5-164.8 850.8-631.4 850.8-1181.4C2490.3 559 1932.8 1.6 1245.2 1.6"
					/>
				</svg>
			);
		case 'google':
			return (
				<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
					<path
						fill="#4285f4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09"
					/>
					<path
						fill="#34a853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23"
					/>
					<path
						fill="#fbbc05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
					/>
					<path
						fill="#ea4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53"
					/>
					<path fill="none" d="M1 1h22v22H1z" />
				</svg>
			);
		default:
			return <></>;
	}
};
