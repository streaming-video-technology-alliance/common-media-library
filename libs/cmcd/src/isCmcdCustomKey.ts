import type { CmcdKey } from './CmcdKey.ts'

const CUSTOM_KEY_REGEX = /^[a-zA-Z0-9.-]+$/

/**
 * Check if a key is a custom key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a custom key, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdCustomKey.test.ts#example}
 */
export function isCmcdCustomKey(key: CmcdKey): boolean {
	// The separator is checked outside the regex to keep matching linear (CodeQL js/polynomial-redos).
	const separator = key.indexOf('-', 1)
	return separator > 0 && separator < key.length - 1 && CUSTOM_KEY_REGEX.test(key)
}
