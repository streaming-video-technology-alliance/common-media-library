/**
 * Returns the size of the box at a position of a `DataView`, with no allocation.
 *
 * The function reads the box header by the rules of ISO/IEC 14496-12, clause 4.2.
 * A box with `size` 0 extends to `end`. A box with `size` 1 has its size in the 8 bytes of `largesize`.
 * The header of a box with `largesize` has 16 bytes. The header of any other box has 8 bytes.
 * The header of a `uuid` box has 16 more bytes for `usertype`.
 *
 * Use the function in a loop over sibling boxes that has no read cursor. `nextIsoBox` does the same step with a read cursor.
 *
 * @param view - The data.
 * @param at - The position of the first byte of the box. The position must be an integer of 0 or more.
 * @param end - The position after the last byte that the box can use. The position must not pass the end of `view`.
 * @param ignoreUserType - If `true`, the header of a `uuid` box does not include `usertype`. The function then returns the size of a `uuid` box with fewer than 16 bytes after its header. The default is `false`.
 * @returns The size of the box in bytes. The result is 0 at `end` and for a truncated box. In a truncated box, the data ends inside the box, or the size is below the header size.
 *
 * @example
 * {@includeCode ../test/readIsoBoxSize.test.ts#example}
 *
 * @public
 */
export function readIsoBoxSize(
	view: DataView,
	at: number,
	end: number,
	ignoreUserType?: boolean,
): number {
	const left = end - at

	if (left < 8) {
		return 0
	}

	let size = view.getUint32(at)
	let header = 8

	if (size === 1) {
		if (left < 16) {
			return 0
		}

		size = view.getUint32(at + 8) * 0x100000000 + view.getUint32(at + 12)
		header = 16
	} else if (size === 0) {
		size = left
	}

	// 0x75756964 is 'uuid'
	if (!ignoreUserType && view.getUint32(at + 4) === 0x75756964) {
		header += 16
	}

	return size >= header && size <= left ? size : 0
}
