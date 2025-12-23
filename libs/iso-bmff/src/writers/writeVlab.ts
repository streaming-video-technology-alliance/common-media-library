import type { Fields } from '../boxes/Fields.ts'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttSourceLabelBox to a Uint8Array.
 *
 * @param box - The WebVttSourceLabelBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeVlab(box: Fields<WebVttSourceLabelBox>): Uint8Array {
	const encoder = new TextEncoder()
	const sourceLabelBytes = encoder.encode(box.sourceLabel)

	const headerSize = 8
	const sourceLabelSize = sourceLabelBytes.length + 1 // null-terminated
	const totalSize = headerSize + sourceLabelSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'vlab', totalSize)

	result.set(sourceLabelBytes, offset)
	offset += sourceLabelBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

