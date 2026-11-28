import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * A box with no reader, as its bytes.
 *
 * `readIsoBoxes` returns a raw box for a box with no reader and a type outside `CONTAINERS`.
 * `writeIsoBoxes` copies the bytes of a raw box unchanged.
 *
 * @public
 */
export type IsoRawBox = {
	/**
	 * The four-character code of the box.
	 */
	type: IsoBoxType

	/**
	 * The complete box, with its header. A raw box from `readIsoBoxes` shares memory with the input.
	 */
	bytes: Uint8Array

	/**
	 * The size of the header in bytes: 8, or 16 with `largesize`, and 16 more for a `uuid` box.
	 * The body of the box is `bytes.subarray(headerSize)`. `readIsoBoxes` sets the field. `writeIsoBoxes` ignores it.
	 */
	headerSize?: number

	/**
	 * The 16-byte user type of a `uuid` box, as a view of `bytes`. The specification names the field `usertype`.
	 * `readIsoBoxes` sets the field only on a `uuid` box. `writeIsoBoxes` ignores it.
	 */
	userType?: Uint8Array
}
