/**
 * Generates avatar initials from a full name.
 *
 * Extracts the first letter of each word, capped at 2 characters,
 * and uppercases the result.
 *
 * @param username - The full name to generate initials from.
 * @returns A 1 or 2 character uppercase string.
 *
 * @example
 * getAvatarInitials('John Doe')        // 'JD'
 * getAvatarInitials('Alice')           // 'A'
 * getAvatarInitials('Jean-Pierre Doe') // 'JD'
 */
export function getAvatarInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}
