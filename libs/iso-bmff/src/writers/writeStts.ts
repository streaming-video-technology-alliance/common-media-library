import type { DecodingTimeToSampleBox } from '../boxes/DecodingTimeToSampleBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a DecodingTimeToSampleBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time to Sample Box
 *
 * @param box - The DecodingTimeToSampleBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeStts(box: Fields<DecodingTimeToSampleBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 8 // 4 bytes sampleCount + 4 bytes sampleDelta
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'stts', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.entryCount)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, 4, entry.sampleCount)
		offset += 4
		writeUint(dataView, offset, 4, entry.sampleDelta)
		offset += 4
	}

	return new Uint8Array(buffer)
}

