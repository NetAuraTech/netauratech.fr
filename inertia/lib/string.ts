/**
 * Capitalizes the first letter of a string, leaving the rest unchanged.
 *
 * @param str - The string to capitalize.
 * @returns The input string with its first character uppercased.
 *
 * @example
 * capitalize('github')   // 'Github'
 * capitalize('myString') // 'MyString'
 * capitalize('')         // ''
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
