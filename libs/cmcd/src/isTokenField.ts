const TOKEN_FIELDS = new Set(['ot', 'sf', 'st', 'e', 'sta'])

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
	return TOKEN_FIELDS.has(key)
}
