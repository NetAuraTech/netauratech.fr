import { type Page } from '@playwright/test'

/**
 * Fills a form field with the given value.
 *
 * Locates the field by its HTML tag type and `name` attribute,
 * then uses Playwright's `pressSequentially()` which triggers
 * proper input events (onChange, onInput) for React components.
 *
 * @param page - Playwright page instance.
 * @param type - The HTML tag type of the field (`input` or `textarea`).
 * @param name - The `name` attribute of the field to fill.
 * @param value - The value to fill into the field.
 *
 * @example
 * await fillField(page, 'input', 'email', 'alice@example.com')
 */
export async function fillField(
  page: Page,
  type: 'input' | 'textarea',
  name: string,
  value: string
): Promise<void> {
  const locator = page.locator(`${type}[name="${name}"]`)
  await locator.clear()
  await locator.pressSequentially(value)
}
