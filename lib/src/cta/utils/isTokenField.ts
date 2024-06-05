/**
 * Checks if the given key is a token field.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a token field.
 *
 * @internal
 */
export function isTokenField(key: string): boolean {
	return key === 'ot' || key === 'sf' || key === 'st';
}
