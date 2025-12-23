import type { Fields } from '../boxes/Fields.ts'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'

/**
 * Write a WebVttConfigurationBox to a Uint8Array.
 *
 * @param box - The WebVttConfigurationBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeVttC(box: Fields<WebVttConfigurationBox>): Uint8Array {
	const encoder = new TextEncoder()
	const configBytes = encoder.encode(box.config)

	const headerSize = 8
	const configSize = configBytes.length
	const totalSize = headerSize + configSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'vttC', totalSize)

	result.set(configBytes, offset)

	return result
}

