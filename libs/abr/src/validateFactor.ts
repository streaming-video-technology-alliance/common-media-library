import { isPositiveFinite } from './isPositiveFinite.ts'

/**
 * Throws a `RangeError` when `value` is not a finite number above 0 and at most 1.
 *
 * @param name - The name of the option, for the error message
 * @param value - The value of the option
 */
export function validateFactor(name: string, value: number): void {
	if (!isPositiveFinite(value) || value > 1) {
		throw new RangeError(`Invalid ${name}: expected a finite number above 0 and at most 1, received ${value}`)
	}
}
