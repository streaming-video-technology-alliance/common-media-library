/**
 * Checks if the given value is `ArrayBufferLike`: an `ArrayBuffer` or a
 * `SharedArrayBuffer`.
 *
 * The function also works where `SharedArrayBuffer` is not defined, such as
 * browser contexts without cross-origin isolation.
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
