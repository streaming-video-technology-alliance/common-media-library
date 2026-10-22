const BOX_HEADER_SIZE = 8 // size(4) + type(4)
const LARGESIZE_HEADER_SIZE = 16 // size(4) + type(4) + largesize(8)
const BOX_TYPE_OFFSET = 4
const LARGESIZE_OFFSET = 8

/**
 * A box of a BMFF byte array.
 *
 * @internal
 */
export type BmffBox = {
	/** Four-character box type code */
	readonly type: string
	/** Offset of the box from the start of the byte array passed to the reader */
	readonly offset: number
	/** Size of the box header: 8, or 16 for a `largesize` box */
	readonly headerSize: number
	/** 1-based index of the box among the boxes of the same type in the same container */
	readonly index: number
	/** The box bytes, including the header */
	readonly bytes: Uint8Array
}

function readBoxType(bytes: Uint8Array, offset: number): string {
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

function nextIndex(boxes: readonly BmffBox[], type: string): number {
	for (let i = boxes.length - 1; i >= 0; i--) {
		if (boxes[i].type === type) return boxes[i].index + 1
	}
	return 1
}

/**
 * Reads the boxes between `start` and `end` of a BMFF byte array in order.
 *
 * A malformed box header stops the walk: a size below the header size, a `largesize`
 * box without room for the `largesize` field, or a box that runs past `end`.
 * The result holds the boxes before the malformed box.
 *
 * @param bytes - Raw BMFF bytes
 * @param start - Offset of the first box
 * @param end - Offset after the last box
 * @returns The boxes, with offsets from the start of `bytes`
 *
 * @internal
 */
export function readBoxes(bytes: Uint8Array, start: number, end: number): BmffBox[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const boxes: BmffBox[] = []
	let offset = start
	while (offset + BOX_HEADER_SIZE <= end) {
		let size = view.getUint32(offset, false)
		let headerSize = BOX_HEADER_SIZE
		// ISO/IEC 14496-12 section 4.2: size 0 extends the box to the end of the data,
		// size 1 puts a 64-bit largesize after the type.
		if (size === 0) {
			size = end - offset
		}
		else if (size === 1) {
			headerSize = LARGESIZE_HEADER_SIZE
			if (offset + headerSize > end) break
			size = view.getUint32(offset + LARGESIZE_OFFSET, false) * 0x100000000 + view.getUint32(offset + LARGESIZE_OFFSET + 4, false)
		}
		if (size < headerSize || offset + size > end) break
		const type = readBoxType(bytes, offset + BOX_TYPE_OFFSET)
		boxes.push({ type, offset, headerSize, index: nextIndex(boxes, type), bytes: bytes.subarray(offset, offset + size) })
		offset += size
	}
	return boxes
}

/**
 * Reads the root boxes of a BMFF byte array in file order. See {@link readBoxes} for malformed headers.
 *
 * @param bytes - Raw BMFF bytes
 * @returns The root boxes
 *
 * @internal
 */
export function readRootBoxes(bytes: Uint8Array): BmffBox[] {
	return readBoxes(bytes, 0, bytes.length)
}
