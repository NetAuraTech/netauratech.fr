import { Field } from '@foundry/design-system/field';
import { SelectOption } from '@foundry/design-system/select';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

/**
 * Contract spec for the `Field` molecule's `children` prop (issue #398):
 * `children` (the `<SelectOption>` list) must reach only the `'select'`
 * control. Every other control resolves to a void-ish host element — React
 * SSR throws when a non-null `children` prop lands on an `<input>` ("input is
 * a self-closing tag and must neither have `children` nor use
 * `dangerouslySetInnerHTML`"), which 500s the whole page, and leaks it as
 * text content on a `<textarea>`. The realistic trigger is a field block
 * whose `options` is an empty array: the JSX `&&` guard evaluates to `[]`, a
 * non-null children value.
 *
 * Server-side rendering is exercised through `react-dom/server` directly, so
 * the spec runs in the fast node environment without jsdom.
 */

describe('Field children contract', () => {
	it('SSR-renders a text field whose children is an empty array', () => {
		const html = renderToStaticMarkup(
			createElement(Field, {
				label: 'Name',
				name: 'name',
				type: 'text',
				children: [],
			}),
		);

		expect(html).toContain('name="name"');
		expect(html).toContain('type="text"');
	});

	it('SSR-renders a checkbox field without leaking children onto the input', () => {
		const html = renderToStaticMarkup(
			createElement(Field, {
				label: 'Subscribe',
				name: 'subscribe',
				type: 'checkbox',
				children: [createElement(SelectOption, { key: 'leak', value: 'leak', label: 'Leaked option' })],
			}),
		);

		expect(html).toContain('type="checkbox"');
		expect(html).not.toContain('Leaked option');
	});

	it('SSR-renders a textarea field without leaking children as content', () => {
		const html = renderToStaticMarkup(
			createElement(Field, {
				label: 'Message',
				name: 'message',
				type: 'textarea',
				children: [createElement(SelectOption, { key: 'leak', value: 'leak', label: 'Leaked option' })],
			}),
		);

		expect(html).toContain('name="message"');
		expect(html).not.toContain('Leaked option');
	});

	it('renders the SelectOption children for a select field', () => {
		const html = renderToStaticMarkup(
			createElement(Field, {
				label: 'Role',
				name: 'role',
				type: 'select',
				children: [
					createElement(SelectOption, { key: 'admin', value: 'admin', label: 'Administrator' }),
					createElement(SelectOption, { key: 'user', value: 'user', label: 'User' }),
				],
			}),
		);

		expect(html).toContain('name="role"');
		expect(html).toContain('value="admin"');
		expect(html).toContain('Administrator');
		expect(html).toContain('value="user"');
	});
});
