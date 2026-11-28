/**
 * Throws the error for a value that a field cannot hold.
 *
 * @param name - The function and its parameter, or the writer and the box field.
 * @param expected - The values that the field takes.
 * @param value - The received value.
 *
 * @internal
 */
export function failRange(name: string, expected: string, value: unknown): never {
	throw new RangeError(`${name} must be ${expected}, received ${String(value)}`)
}
