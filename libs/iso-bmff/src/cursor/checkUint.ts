import { failInteger } from './failInteger.ts'

/**
 * Checks a value that takes a number of bits of an integer field.
 *
 * @param name - The box field.
 * @param value - The value to check.
 * @param max - The largest value of the field, at most 2^32 - 1.
 * @returns The value.
 *
 * @throws RangeError if `value` is not an integer from 0 to `max`.
 *
 * @internal
 */
export function checkUint(name: string, value: number | undefined, max: number): number {
	if (typeof value !== 'number' || value >>> 0 !== value || value > max) {
		failInteger(name, value, 0, max)
	}

	return value
}
