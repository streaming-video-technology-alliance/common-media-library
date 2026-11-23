import { failInteger } from './failInteger.ts'

/**
 * Checks a value of an integer field of any size.
 *
 * @param name - The function and its parameter, or the box field.
 * @param value - The value to check.
 * @param min - The smallest value of the field.
 * @param max - The largest value of the field.
 * @returns The value.
 *
 * @throws RangeError if `value` is not an integer from `min` to `max`.
 *
 * @internal
 */
export function checkInteger(name: string, value: number, min: number, max: number): number {
	if (typeof value !== 'number' || !(value >= min && value <= max) || value % 1 !== 0) {
		failInteger(name, value, min, max)
	}

	return value
}
