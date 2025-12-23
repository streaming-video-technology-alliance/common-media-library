import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a CompositionTimeToSampleBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time to Sample Box
 *
 * @param box - The CompositionTimeToSampleBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeCtts(box: Fields<CompositionTimeToSampleBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 8 // 4 bytes sampleCount + 4 bytes sampleOffset
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'ctts', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.entryCount)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, 4, entry.sampleCount)
		offset += 4
		// For version 1, sampleOffset is signed, but we store as unsigned
		writeUint(dataView, offset, 4, entry.sampleOffset)
		offset += 4
	}

	return new Uint8Array(buffer)
}

