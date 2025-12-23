import type { Fields } from '../boxes/Fields.ts'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttCueIdBox to a Uint8Array.
 *
 * @param box - The WebVttCueIdBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeIden(box: Fields<WebVttCueIdBox>): Uint8Array {
	const encoder = new TextEncoder()
	const cueIdBytes = encoder.encode(box.cueId)

	const headerSize = 8
	const cueIdSize = cueIdBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueIdSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'iden', totalSize)

	result.set(cueIdBytes, offset)
	offset += cueIdBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

