/**
 * Returns the size that the header of the box at a position declares, with no allocation.
 *
 * The result is the value of the `size` field, or of the `largesize` field for a `size` of 1 (ISO/IEC 14496-12, clause 4.2).
 * The size includes the header. For a `size` of 0, the box extends to `end`, and the result is `end - at`.
 *
 * The function does not compare the result with the remaining bytes or with the header size.
 * `readIsoBoxSize` returns 0 for a truncated box and for an invalid size. Call this function to tell the cases apart:
 * a result of 0 means that the header is incomplete, a result above `end - at` means that the data ends inside the box,
 * and any other result is an invalid size.
 *
 * A `largesize` above `Number.MAX_SAFE_INTEGER` loses precision.
 *
 * @param view - The data.
 * @param at - The position of the first byte of the box. The position must be an integer of 0 or more.
 * @param end - The position after the last byte that the box can use. The position must not pass the end of `view`.
 * @returns The declared size of the box in bytes. The result is 0 if fewer than 8 bytes remain, or fewer than 16 bytes for a `size` of 1.
 *
 * @example
 * {@includeCode ../test/readIsoBoxDeclaredSize.test.ts#example}
 *
 * @public
 */
export function readIsoBoxDeclaredSize(view: DataView, at: number, end: number): number {
	const left = end - at

	if (left < 8) {
		return 0
	}

	const size = view.getUint32(at)

	if (size === 1) {
		return left < 16 ? 0 : view.getUint32(at + 8) * 0x100000000 + view.getUint32(at + 12)
	}

	return size || left
}
