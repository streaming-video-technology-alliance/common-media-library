import type { Fields } from '../boxes/Fields.ts'
import type { TrackKindBox } from '../boxes/TrackKindBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'

/**
 * Write a TrackKindBox to a Uint8Array.
 *
 * @param box - The TrackKindBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeKind(box: Fields<TrackKindBox>): Uint8Array {
	const encoder = new TextEncoder()
	const schemeUriBytes = encoder.encode(box.schemeUri)
	const valueBytes = encoder.encode(box.value)

	const headerSize = 8
	const fullBoxSize = 4
	const schemeUriSize = schemeUriBytes.length + 1 // null-terminated
	const valueSize = valueBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + schemeUriSize + valueSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'kind', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	result.set(schemeUriBytes, offset)
	offset += schemeUriBytes.length
	dataView.setUint8(offset, 0) // null terminator
	offset += 1

	result.set(valueBytes, offset)
	offset += valueBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

