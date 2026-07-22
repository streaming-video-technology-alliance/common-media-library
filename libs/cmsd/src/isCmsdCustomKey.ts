// The CMSD custom-key charset restricted to RFC 8941 key serialization
// (serializeKey): a lowercase first letter, then `a-z 0-9 . -`.
const CUSTOM_KEY_REGEX = /^[a-z][a-z0-9.-]*$/

/**
 * Check if a key is a valid custom key: a lowercase first letter, then
 * characters from `a-z 0-9 . -`, with a hyphen that is neither the first
 * nor the last character. These are the CMSD custom-key rules restricted
 * to names that survive RFC 8941 key serialization.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a custom key, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmsdCustomKey.test.ts#example}
 */
export function isCmsdCustomKey(key: string): boolean {
	// The separator is checked outside the regex to keep matching linear (CodeQL js/polynomial-redos).
	const separator = key.indexOf('-', 1)
	return separator > 0 && separator < key.length - 1 && CUSTOM_KEY_REGEX.test(key)
}
