import type { Fields } from '../boxes/Fields.ts'
import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttEmptySampleBox to a Uint8Array.
 *
 * @param _box - The WebVttEmptySampleBox fields to write (empty)
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeVtte(_box: Fields<WebVttEmptySampleBox>): Uint8Array {
	const headerSize = 8
	const totalSize = headerSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	writeBoxHeader(dataView, 0, 'vtte', totalSize)

	return new Uint8Array(buffer)
}

