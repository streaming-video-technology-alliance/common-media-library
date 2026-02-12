/**
 * Checks if the given value is {@link ArrayBufferLike}
 * (i.e. an `ArrayBuffer` or a `SharedArrayBuffer`).
 *
 * This function safely handles environments where
 * `SharedArrayBuffer` is not defined, such as non-cross-origin
 * isolated browser contexts.
 *
 * @param value - The value to check.
 * @returns `true` if the value is an `ArrayBuffer` or `SharedArrayBuffer`.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isArrayBufferLike.test.ts#example}
 */
export function isArrayBufferLike(value: unknown): value is ArrayBufferLike {
	return value instanceof ArrayBuffer
		|| (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer)
}
