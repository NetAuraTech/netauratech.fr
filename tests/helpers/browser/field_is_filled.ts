import { type Page } from '@playwright/test'

/**
 * Checks if a form field is filled and valid.
 *
 * Uses the browser's native constraint validation API to determine
 * whether the field has a value and passes its validation constraints.
 *
 * @param page - Playwright page instance.
 * @param type - The HTML tag type of the field (`input` or `textarea`).
 * @param name - The `name` attribute of the field to inspect.
 * @returns An object containing the field locator, whether the field
 *   passes native validation (`isValid`), and whether the field is
 *   missing a required value (`isValueMissing`).
 *
 * @example
 * const { field, isValid, isValueMissing } = await fieldIsFilled(page, 'input', 'email')
 * if (!isValid) { await field.fill('valid@email.com') }
 */
export async function fieldIsFilled(page: Page, type: 'input' | 'textarea', name: string) {
  const field = page.locator(`${type}[name="${name}"]`)

  const isValid = await field.evaluate((el: HTMLInputElement) => el.checkValidity())

  const isValueMissing = await field.evaluate((el: HTMLInputElement) => el.validity.valueMissing)

  return { field, isValid, isValueMissing }
}
