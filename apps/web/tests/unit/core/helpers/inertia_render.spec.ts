import { type Inertia } from '@adonisjs/inertia';
import { test } from '@japa/runner';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';

interface RecordedCall {
	page: unknown;
	props: unknown;
}

/**
 * Builds a minimal Inertia double whose `render` records its arguments and
 * returns a marker, mirroring the page adapter spec's context double. The
 * double reads through `this` on purpose: the real `Inertia#render` does too,
 * so this pins the helper's obligation to keep the receiver bound.
 */
function createFakeInertia() {
	const inertia = {
		calls: [] as RecordedCall[],
		render(this: { calls: RecordedCall[] }, page: unknown, props: unknown) {
			this.calls.push({ page, props });
			return { rendered: true, page, props };
		},
	};

	return { inertia: inertia as unknown as Inertia<any>, calls: inertia.calls };
}

test.group('renderInertiaPage', () => {
	test('delegates to inertia.render with the page name and props', async ({ assert }) => {
		const { inertia, calls } = createFakeInertia();

		const result = await renderInertiaPage(inertia, 'errors/not_found', {});

		assert.deepEqual(calls, [{ page: 'errors/not_found', props: {} }]);
		assert.deepEqual(result, { rendered: true, page: 'errors/not_found', props: {} });
	});

	test('accepts per-page props for discovered pages', async ({ assert }) => {
		const { inertia, calls } = createFakeInertia();

		await renderInertiaPage(inertia, 'core/front/home', {
			translations: { welcome: 'Welcome', tagline: 'Tagline' },
		});

		assert.deepEqual(calls, [
			{ page: 'core/front/home', props: { translations: { welcome: 'Welcome', tagline: 'Tagline' } } },
		]);
	});

	test('accepts a dynamic string page name for declarative page endpoints', async ({ assert }) => {
		const { inertia, calls } = createFakeInertia();
		const component = 'role/admin/index' as string;

		const result = await renderInertiaPage(inertia, component, { roles: [] });

		assert.deepEqual(calls, [{ page: 'role/admin/index', props: { roles: [] } }]);
		assert.deepEqual(result, { rendered: true, page: 'role/admin/index', props: { roles: [] } });
	});
});
