import { failRange } from './failRange.ts'

/**
 * Throws the error for a value that an integer field cannot hold.
 *
 * @param name - The function and its parameter, or the box field.
 * @param value - The received value.
 * @param min - The smallest value of the field.
 * @param max - The largest value of the field.
 *
 * @internal
 */
export function failInteger(name: string, value: unknown, min: number, max: number): never {
	return failRange(name, `an integer from ${min} to ${max}`, value)
}
