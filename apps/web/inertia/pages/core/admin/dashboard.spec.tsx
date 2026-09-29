import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DashboardPage from '~/pages/core/admin/dashboard';
import type { AdminDashboardTranslations } from '#transport/core/helpers/i18n_payloads/dashboard';
import type { Data } from '@generated/data';
import type { ReactNode } from 'react';

/**
 * Conditional-rendering seam for the admin dashboard page: every core section
 * (identity, file) renders when its key is present in the payload and disappears
 * when it is not — the contract that lets a pruned flavor drop a domain
 * without leaving empty figures behind.
 *
 * The CMS sections (page, template) are asserted in
 * `inertia/pages/cms/dashboard_cms.spec.tsx` so the `inertia` flavor can prune
 * them alongside the CMS card modules.
 *
 * Inertia's server-provided context (page props, Head manager, Tuyau Link
 * routes) is substituted with narrow mocks; atoms, guards and the
 * translation hook run for real.
 */

const { mockPageProps } = vi.hoisted(() => ({
	mockPageProps: {
		props: {
			locale: 'en',
			currentUser: {
				permissions: ['users.view', 'files.view'],
				role: { slug: 'admin' },
			},
		},
	},
}));

vi.mock('@inertiajs/react', () => ({
	usePage: () => mockPageProps,
	Head: () => null,
}));

vi.mock('@adonisjs/inertia/react', () => ({
	Link: ({ children }: { children?: ReactNode }) => <a>{children}</a>,
}));

vi.mock('~/layouts/admin', () => ({
	default: ({ children }: { children?: ReactNode }) => children,
}));
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const translations: AdminDashboardTranslations = {
	title: 'Dashboard',
	cards: {
		users: 'Users',
		files: 'Files',
		folders: 'Folders',
		no_role: 'No role',
	},
	recent: {
		uploads: 'Recent uploads',
		empty: 'Nothing to display yet.',
	},
	view_all: 'View all',
};

const coreStats: Data.Core.Dashboard = {
	identity: {
		users: 2,
		usersByRole: [
			{ name: 'admin', count: 1 },
			{ name: null, count: 1 },
		],
	},
	file: {
		files: 5,
		fileFolders: 2,
		filesByFolder: [{ id: 7, name: 'banners', count: 5 }],
		recentFiles: [
			{
				id: 21,
				originalName: 'hero.png',
				mimeType: 'image/png',
				size: 1024,
				createdAt: '2026-08-02T10:00:00.000Z',
			},
		],
	},
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

async function render(stats: Data.Core.Dashboard): Promise<string> {
	await act(async () => {
		root.render(<DashboardPage stats={stats} translations={translations} />);
	});
	return container.textContent ?? '';
}

describe('DashboardPage', () => {
	it('renders every core section when all keys are present', async () => {
		const content = await render(coreStats);

		// Identity section.
		expect(content).toContain('Users');
		expect(content).toContain('1 admin');
		expect(content).toContain('1 No role');
		// File section.
		expect(content).toContain('Folders: 2');
		expect(content).toContain('5 banners');
		// Recent-activity list.
		expect(content).toContain('Recent uploads');
		expect(content).toContain('hero.png');
	});

	it('renders only the sections whose key is present', async () => {
		const { file: _file, ...identityOnlyStats } = coreStats;
		const content = await render(identityOnlyStats);

		expect(content).toContain('Users');
		// The file section leaves nothing behind.
		expect(content).not.toContain('Folders:');
		expect(content).not.toContain('Recent uploads');
		expect(content).not.toContain('hero.png');
	});

	it('renders the page shell without figures when no key is present', async () => {
		const content = await render({});

		expect(content).toContain('Dashboard');
		expect(content).not.toContain('Users');
		expect(content).not.toContain('Folders:');
		expect(content).not.toContain('Recent uploads');
		expect(content).not.toContain('Nothing to display yet.');
	});
});

/**
 * Permission-based hiding: the server ships every section's figures to any
 * admin, so the client hides a section card the current user may not see
 * (via `CanAccess`) even when its data is present in the payload.
 */
describe('DashboardPage | permission-based hiding', () => {
	function setPermissions(permissions: string[]) {
		mockPageProps.props.currentUser.permissions = permissions;
	}

	it('hides the identity card when users.view is missing', async () => {
		setPermissions(['files.view']);
		const content = await render(coreStats);

		expect(content).not.toContain('Users');
		expect(content).toContain('Folders: 2');
		expect(content).toContain('Recent uploads');
	});

	it('hides the file card when files.view is missing', async () => {
		setPermissions(['users.view']);
		const content = await render(coreStats);

		expect(content).toContain('Users');
		expect(content).not.toContain('Folders:');
		expect(content).not.toContain('Recent uploads');
	});

	it('hides every section card when the admin holds no matching permission', async () => {
		setPermissions([]);
		const content = await render(coreStats);

		expect(content).toContain('Dashboard');
		expect(content).not.toContain('Users');
		expect(content).not.toContain('Folders:');
		expect(content).not.toContain('Recent uploads');
	});
});
