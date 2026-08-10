import { type Page } from '@playwright/test'
import { type VisitOptions } from '@japa/browser-client/types'

/**
 * Visits a page using Japa's browser client and waits until the
 * network is idle.
 *
 * This ensures the page is fully loaded before returning the
 * Playwright page instance, reducing flakiness in tests.
 *
 * @param url - The URL path to visit (e.g., `/login`).
 * @param visit - Japa browser client's `visit` function.
 * @returns The Playwright page instance after the network is idle.
 *
 * @example
 * const page = await visitPage('/dashboard', visit)
 * // page is ready for interaction
 */
export async function visitPage(
  url: string,
  visit: (url: string, options?: VisitOptions) => Promise<Page>
) {
  const page = await visit(url)

  await page.waitForLoadState('networkidle')

  return page
}
