const BOX_HEADER_SIZE = 8 // size(4) + type(4)
const LARGESIZE_HEADER_SIZE = 16 // size(4) + type(4) + largesize(8)
const BOX_TYPE_OFFSET = 4
const LARGESIZE_OFFSET = 8

/**
 * A root box of a BMFF byte array.
 *
 * @internal
 */
export type RootBox = {
	/** Four-character box type code */
	readonly type: string
	/** Offset of the box from the start of the byte array */
	readonly offset: number
	/** The box bytes, including the header */
	readonly bytes: Uint8Array
}

function readBoxType(bytes: Uint8Array, offset: number): string {
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

/**
 * Reads the root boxes of a BMFF byte array in file order.
 *
 * A malformed box header stops the walk: a size below the header size, a `largesize`
 * box without room for the `largesize` field, or a box that runs past the end of the bytes.
 * The result holds the boxes before the malformed box.
 *
 * @param bytes - Raw BMFF bytes
 * @returns The root boxes
 *
 * @internal
 */
export function readRootBoxes(bytes: Uint8Array): RootBox[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const end = bytes.length
	const boxes: RootBox[] = []
	let offset = 0
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
		boxes.push({ type: readBoxType(bytes, offset + BOX_TYPE_OFFSET), offset, bytes: bytes.subarray(offset, offset + size) })
		offset += size
	}
	return boxes
}
