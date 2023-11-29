/**
 * Checks if the given key is a token field.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a token field.
 *
 * @internal
 *
 * @group CMCD
 */
export const isTokenField = (key: string) =>
	key === 'ot' || key === 'sf' || key === 'st';
