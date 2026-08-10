import { type Page } from '@playwright/test'

/**
 * Waits for an Inertia.js response after triggering an action.
 *
 * Inertia responses are identified by the `X-Inertia: true` response
 * header. This helper waits for a response whose URL contains the
 * given substring and has the Inertia header, while simultaneously
 * triggering the action that should trigger the Inertia request.
 *
 * @param page - Playwright page instance.
 * @param urlIncludes - Substring that the response URL must contain
 *   (e.g., `/settings/profile`).
 * @param triggerAction - Async function that triggers the Inertia
 *   request (e.g., clicking a button or submitting a form).
 * @returns The Playwright Response object matching the Inertia request.
 *
 * @example
 * const response = await waitForInertiaResponse(page, '/settings/profile', () =>
 *   page.locator('button[type=\u0022submit\u0022]').click()
 * )
 * expect(response.ok()).toBeTruthy()
 */
export async function waitForInertiaResponse(
  page: Page,
  urlIncludes: string,
  triggerAction: () => Promise<unknown>
) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res: any) => res.url().includes(urlIncludes) && res.headers()['x-inertia'] === 'true'
    ),
    triggerAction(),
  ])

  return response
}
