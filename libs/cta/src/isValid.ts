
/**
 * Checks if the given value is valid
 *
 * @param value - The value to check.
 *
 * @returns `true` if the key is a value is valid.
 *
 * @internal
 */
export function isValid(value: unknown): boolean {
	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	return value != null && value !== '' && value !== false
}
