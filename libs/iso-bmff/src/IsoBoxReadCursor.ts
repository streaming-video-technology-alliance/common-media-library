/**
 * A position in the bytes of ISO BMFF data, for the read field functions.
 *
 * `start`, `pos`, and `end` count bytes from the first byte of `view`.
 * A field function reads at `pos` and moves `pos` past the field.
 * A field function that reads past `end` throws a `RangeError`.
 *
 * @public
 */
export type IsoBoxReadCursor = {
	/**
	 * The bytes to read.
	 */
	readonly view: DataView

	/**
	 * The first byte of the box header, or 0 for a new cursor.
	 */
	readonly start: number

	/**
	 * The position of the next read. A reader can move the position, as in `cursor.pos += 4`.
	 */
	pos: number

	/**
	 * The first byte after the box, or the byte length of the data for a new cursor.
	 */
	readonly end: number
}
