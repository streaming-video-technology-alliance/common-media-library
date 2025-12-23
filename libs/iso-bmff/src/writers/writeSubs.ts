import type { Fields } from '../boxes/Fields.ts'
import type { SubsampleInformationBox } from '../boxes/SubsampleInformationBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SubsampleInformationBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.7.7 Sub-Sample Information Box
 *
 * @param box - The SubsampleInformationBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSubs(box: Fields<SubsampleInformationBox>): Uint8Array {
	const v1 = box.version === 1
	const subsampleSizeBytes = v1 ? 4 : 2

	let entriesSize = 0
	for (const entry of box.entries) {
		entriesSize += 4 // sampleDelta
		entriesSize += 2 // subsampleCount
		entriesSize += entry.subsampleCount * (subsampleSizeBytes + 1 + 1 + 4) // size + priority + discardable + codecSpecificParameters
	}

	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'subs', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.entryCount)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, 4, entry.sampleDelta)
		offset += 4

		writeUint(dataView, offset, 2, entry.subsampleCount)
		offset += 2

		for (const subsample of entry.subsamples) {
			writeUint(dataView, offset, subsampleSizeBytes, subsample.subsampleSize)
			offset += subsampleSizeBytes

			writeUint(dataView, offset, 1, subsample.subsamplePriority)
			offset += 1

			writeUint(dataView, offset, 1, subsample.discardable)
			offset += 1

			writeUint(dataView, offset, 4, subsample.codecSpecificParameters)
			offset += 4
		}
	}

	return new Uint8Array(buffer)
}

