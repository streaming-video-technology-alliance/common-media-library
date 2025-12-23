import type { Fields } from '../boxes/Fields.ts'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttSettingsBox to a Uint8Array.
 *
 * @param box - The WebVttSettingsBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSttg(box: Fields<WebVttSettingsBox>): Uint8Array {
	const encoder = new TextEncoder()
	const settingsBytes = encoder.encode(box.settings)

	const headerSize = 8
	const settingsSize = settingsBytes.length + 1 // null-terminated
	const totalSize = headerSize + settingsSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'sttg', totalSize)

	result.set(settingsBytes, offset)
	offset += settingsBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

