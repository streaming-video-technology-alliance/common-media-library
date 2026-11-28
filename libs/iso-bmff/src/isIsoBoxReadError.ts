import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * The box that `readChildBoxes` was reading when a `RangeError` occurred.
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
	 * The position of the cursor when the error occurred, as a byte offset from the first byte of the data of the cursor.
	 * For a field that passes the end of the box, the position is the first byte of that field.
	 */
	readonly pos: number
}

/**
 * A `RangeError` from a read of `readIsoBoxes` or `readChildBoxes`, with the box that the function was reading.
 *
 * When a `RangeError` occurs during the read of a box, `readChildBoxes` adds the `box` field to that error and throws the same error.
 * The error keeps its class, its name, and its message.
 * The field names the innermost box: for a `moof` box with a short `tfdt` box, `box.type` is `tfdt`.
 *
 * The field does not state the cause. A reader throws a `RangeError` for a box that is too short for its fields.
 * `readChildBoxes` throws one for a box deeper than 128 levels. A custom reader can throw one for another reason.
 *
 * `readChildBoxes` adds the field once. A reader must throw a new error for each failure, because an error that has the field keeps it.
 * `readChildBoxes` does not add the field to an error of another class, such as a `TypeError` of a custom reader, or to an error that is not extensible.
 *
 * @public
 */
export type IsoBoxReadError = RangeError & {
	/**
	 * The box that `readChildBoxes` was reading when the error occurred.
	 */
	readonly box: IsoBoxReadErrorBox
}

/**
 * Check if an error is a `RangeError` with the `box` field of `IsoBoxReadError`. This function is a type guard.
 *
 * @param error - The caught value.
 * @returns `true` if the value is a `RangeError` and its `box` field is an object, `false` otherwise.
 *
 * @example
 * {@includeCode ../test/isIsoBoxReadError.test.ts#example}
 *
 * @public
 */
export function isIsoBoxReadError(error: unknown): error is IsoBoxReadError {
	const box = error instanceof RangeError && (error as RangeError & { box?: unknown }).box

	return typeof box === 'object' && box !== null
}
