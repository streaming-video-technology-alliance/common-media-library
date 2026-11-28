/**
 * Returns the size of the header of the box at a position: 8 bytes, or 16 bytes for a box with `largesize`.
 *
 * A box header has the `size` field and the type. A `size` of 1 adds the 8 bytes of `largesize` (ISO/IEC 14496-12, clause 4.2).
 * The result does not include the `usertype` of a `uuid` box. So `at + readIsoBoxHeaderSize(view, at)` is the `pos` of a read cursor
 * for the box, as in the cursors of `seekIsoBox` and `iterateChildBoxes`.
 *
 * The function reads the 4 bytes of the `size` field. Call the function for a box with a complete header:
 * `readIsoBoxSize` or `readIsoBoxDeclaredSize` returns a size above 0 for that box.
 *
 * @param view - The data.
 * @param at - The position of the first byte of the box. The position must be an integer of 0 or more.
 * @returns 16 if the `size` field of the box is 1, 8 otherwise.
 *
 * @example
 * {@includeCode ../test/readIsoBoxDeclaredSize.test.ts#header}
 *
 * @public
 */
export function readIsoBoxHeaderSize(view: DataView, at: number): number {
	return view.getUint32(at) === 1 ? 16 : 8
}
