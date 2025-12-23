import type { Fields } from '../boxes/Fields.ts'
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttCuePayloadBox to a Uint8Array.
 *
 * @param box - The WebVttCuePayloadBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writePayl(box: Fields<WebVttCuePayloadBox>): Uint8Array {
	const encoder = new TextEncoder()
	const cueTextBytes = encoder.encode(box.cueText)

	const headerSize = 8
	const cueTextSize = cueTextBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueTextSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'payl', totalSize)

	result.set(cueTextBytes, offset)
	offset += cueTextBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

