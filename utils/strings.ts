/**
 * String and regex utility functions.
 * Pure utility functions with no dependencies on page objects or Playwright.
 */

/**
 * Escape a string for safe use in RegExp constructors.
 * Escapes all special regex characters: . * + ? ^ $ { } ( ) | [ ] \
 * 
 * @param value - The string to escape
 * @returns The escaped string safe for use in RegExp
 * 
 * @example
 * escapeForRegex('Hello (World)') // 'Hello \\(World\\)'
 * escapeForRegex('$19.99') // '\\$19\\.99'
 */
export function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a case-insensitive word-boundary regex for matching product/brand names.
 * Useful for finding exact matches of names that may contain special characters.
 * 
 * @param name - The name to create a regex pattern for
 * @returns A RegExp that matches the name with word boundaries, case-insensitive
 * 
 * @example
 * createNameRegex('Blue Top').test('Blue Top') // true
 * createNameRegex('Blue Top').test('Blue Tops') // false (word boundary)
 * createNameRegex('Blue Top').test('blue top') // true (case-insensitive)
 */
export function createNameRegex(name: string): RegExp {
  const escaped = escapeForRegex(name);
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

/**
 * Create a regex pattern for partial matching (useful for search/filter).
 * Unlike createNameRegex, this doesn't require word boundaries.
 * 
 * @param text - The text to create a pattern for
 * @param caseInsensitive - Whether to make the pattern case-insensitive (default: true)
 * @returns A RegExp for partial matching
 * 
 * @example
 * createPartialMatchRegex('blue').test('Blue Top') // true
 * createPartialMatchRegex('top').test('Blue Top') // true
 */
export function createPartialMatchRegex(text: string, caseInsensitive: boolean = true): RegExp {
  const escaped = escapeForRegex(text);
  return new RegExp(escaped, caseInsensitive ? 'i' : '');
}

