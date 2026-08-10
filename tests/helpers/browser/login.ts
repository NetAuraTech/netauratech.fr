import { visitPage } from '#tests/helpers/browser/visit_page'
import { fillField } from '#tests/helpers/browser/fill_field'
import type { VisitOptions } from '@japa/browser-client/types'
import type { Page } from '@playwright/test'

/**
 * Logs in a user by visiting the login page, filling credentials,
 * and submitting the form.
 *
 * Waits for the post-login redirect to `/settings/profile` to confirm
 * successful authentication.
 *
 * @param url - The login page URL (e.g., `/login`).
 * @param visit - Japa browser client's `visit` function for navigation.
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns The authenticated Playwright page instance, already
 *   redirected to the post-login destination.
 *
 * @example
 * const page = await login('/login', visit, 'alice@example.com', 'secret123')
 * // page.url() === 'http://localhost:3333/settings/profile'
 */
export async function login(
  url: string,
  visit: (url: string, options?: VisitOptions) => Promise<Page>,
  email: string,
  password: string
) {
  const page = await visitPage(url, visit)

  await fillField(page, 'input', 'email', email)
  await fillField(page, 'input', 'password', password)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL(/\/settings\/profile/)

  return page
}
