import { readIsoBoxSize } from '@svta/cml-iso-bmff'

const BOX_HEADER_SIZE = 8 // size(4) + type(4)
const LARGESIZE_HEADER_SIZE = 16 // size(4) + type(4) + largesize(8)
const BOX_TYPE_OFFSET = 4

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
	const counts = new Map<string, number>()
	let offset = start
	let size: number
	// Box header rules of ISO/IEC 14496-12, clause 4.2. A uuid box needs no room for usertype.
	while ((size = readIsoBoxSize(view, offset, end, true))) {
		const headerSize = view.getUint32(offset) === 1 ? LARGESIZE_HEADER_SIZE : BOX_HEADER_SIZE
		const type = readBoxType(bytes, offset + BOX_TYPE_OFFSET)
		const index = (counts.get(type) ?? 0) + 1
		counts.set(type, index)
		boxes.push({ type, offset, headerSize, index, bytes: bytes.subarray(offset, offset + size) })
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
