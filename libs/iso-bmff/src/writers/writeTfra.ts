import type { Fields } from '../boxes/Fields.ts'
import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackFragmentRandomAccessBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
 * @param box - The TrackFragmentRandomAccessBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTfra(box: Fields<TrackFragmentRandomAccessBox>): Uint8Array {
	const v1 = box.version === 1
	const timeSize = v1 ? 8 : 4
	const entrySize = timeSize + timeSize + // time + moofOffset
		(box.lengthSizeOfTrafNum + 1) +
		(box.lengthSizeOfTrunNum + 1) +
		(box.lengthSizeOfSampleNum + 1)

	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const reservedSize = 4
	const numberOfEntrySize = 4
	const entriesSize = box.numberOfEntry * entrySize
	const totalSize = headerSize + fullBoxSize + trackIdSize + reservedSize + numberOfEntrySize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'tfra', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.trackId)
	offset += 4

	// Pack reserved with length sizes
	const reserved = (box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum
	writeUint(dataView, offset, 4, reserved)
	offset += 4

	writeUint(dataView, offset, 4, box.numberOfEntry)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, timeSize, entry.time)
		offset += timeSize

		writeUint(dataView, offset, timeSize, entry.moofOffset)
		offset += timeSize

		writeUint(dataView, offset, box.lengthSizeOfTrafNum + 1, entry.trafNumber)
		offset += box.lengthSizeOfTrafNum + 1

		writeUint(dataView, offset, box.lengthSizeOfTrunNum + 1, entry.trunNumber)
		offset += box.lengthSizeOfTrunNum + 1

		writeUint(dataView, offset, box.lengthSizeOfSampleNum + 1, entry.sampleNumber)
		offset += box.lengthSizeOfSampleNum + 1
	}

	return new Uint8Array(buffer)
}

