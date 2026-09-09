/**
 * Checks if the given value can be sent as a CMCD value.
 *
 * `undefined`, `null`, an empty string, `false`, an empty array, and a
 * number that is not finite are not valid. CTA-5004-B requires the key
 * to be omitted when its value is unknown.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is valid.
 *
 * @internal
 */
export function isValid(value: unknown): boolean {
	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	if (Array.isArray(value)) {
		return value.length > 0
	}

	return value != null && value !== '' && value !== false
}
