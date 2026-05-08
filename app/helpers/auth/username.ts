/**
 * Derives a human-readable display name from an email address.
 *
 * Extracts the local part (before `@`), strips all digits, replaces the
 * common separators (`.` `_` `-` `+`) with spaces, and title-cases each
 * resulting word.
 *
 * @param email - The email address to extract a name from.
 * @returns A title-cased display name, or an empty string if no usable
 *   characters remain after sanitisation.
 *
 * @example
 * extractNameFromEmail('john.doe@example.com')  // 'John Doe'
 * extractNameFromEmail('jane_smith42@example.com') // 'Jane Smith'
 * extractNameFromEmail('user+tag@example.com')  // 'User Tag'
 */
export function extractNameFromEmail(email: string): string {
  const local = email.split('@')[0]

  const name = local.replace(/[0-9]/g, '').replace(/[._\-+]/g, ' ')

  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Generates a unique username by appending a numeric suffix if the base
 * username is already taken.
 *
 * @param base - The desired username (already sanitized).
 * @param exists - Async function that checks if a username is taken.
 * @returns A unique username.
 *
 * @example
 * await generateUniqueUsername('johndoe', (u) => userRepository.exists({ username: u }))
 * // 'johndoe' if free, 'johndoe1', 'johndoe2', etc.
 */
export async function generateUniqueUsername(
  base: string,
  exists: (username: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) {
    return base
  }

  let counter = 1
  while (await exists(`${base}${counter}`)) {
    counter++
  }

  return `${base}${counter}`
}
