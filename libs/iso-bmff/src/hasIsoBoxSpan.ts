/**
 * The position of a box in the data, as byte offsets from the first byte of the data that the cursor reads.
 *
 * `readIsoBoxes` and `readChildBoxes` set the two fields on every box when the `spans` option is `true`.
 * The fields follow the `start` and `end` of a read cursor. The bytes of the box are `data.subarray(start, end)` for a view that starts at the first byte of the data.
 *
 * @public
 */
export type IsoBoxSpan = {
	/**
	 * The first byte of the box header.
	 */
	start: number

	/**
	 * The first byte after the box.
	 */
	end: number
}

/**
 * Check if a box has the `start` and `end` fields of `IsoBoxSpan`. This is a type guard function.
 *
 * A box from a read with the `spans` option has the fields at every level. The result type of `readIsoBoxes` has the fields at the first level only.
 * Use the function to read the position of a child box in `boxes`.
 *
 * @param box - The box to check.
 * @returns `true` if the box has the two fields, `false` otherwise.
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#spans}
 *
 * @public
 */
export function hasIsoBoxSpan<B extends { type: string }>(box: B): box is B & IsoBoxSpan {
	return 'start' in box && 'end' in box
}
