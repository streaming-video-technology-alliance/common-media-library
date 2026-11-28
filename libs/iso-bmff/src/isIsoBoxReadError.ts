import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * The position of the box whose reader failed.
 *
 * @public
 */
export type IsoBoxReadErrorBox = {
	/**
	 * The four-character code of the box.
	 */
	readonly type: IsoBoxType

	/**
	 * The first byte of the header of the box, as a byte offset from the first byte of the data of the cursor.
	 */
	readonly start: number

	/**
	 * The position of the cursor when the reader failed, as a byte offset from the first byte of the data of the cursor.
	 * For a field that passes the end of the box, the position is the first byte of that field.
	 */
	readonly pos: number
}

/**
 * A `RangeError` of a reader inside `readIsoBoxes` or `readChildBoxes`, with the position of the box that failed.
 *
 * When a reader throws a `RangeError`, `readChildBoxes` adds the `box` field to that error and throws the same error.
 * The error keeps its class, its name, and its message, so a `catch` of `RangeError` and a test of the message do not change.
 * The field names the innermost box: for a `moof` box with a short `tfdt` box, `box.type` is `tfdt`.
 *
 * `readChildBoxes` does not add the field to an error of another class, such as a `TypeError` of a custom reader, or to an error that is not extensible.
 *
 * @public
 */
export type IsoBoxReadError = RangeError & {
	/**
	 * The position of the box whose reader failed.
	 */
	readonly box: IsoBoxReadErrorBox
}

/**
 * Check if an error is a `RangeError` of a reader with the position of the box that failed. This is a type guard function.
 *
 * @param error - The caught value.
 * @returns `true` if the value is a `RangeError` with the `box` field of `IsoBoxReadError`, `false` otherwise.
 *
 * @example
 * {@includeCode ../test/isIsoBoxReadError.test.ts#example}
 *
 * @public
 */
export function isIsoBoxReadError(error: unknown): error is IsoBoxReadError {
	return error instanceof RangeError && 'box' in error
}
