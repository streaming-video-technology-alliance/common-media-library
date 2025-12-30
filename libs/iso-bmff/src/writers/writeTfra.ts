import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackFragmentRandomAccessBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
 * @param box - The TrackFragmentRandomAccessBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTfra(box: TrackFragmentRandomAccessBox): IsoBoxWriteView {
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

	const writer = new IsoBoxWriteView('tfra', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.trackId, 4)

	// Pack reserved with length sizes
	const reserved = (box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum
	writer.writeUint(reserved, 4)

	writer.writeUint(box.numberOfEntry, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.time, timeSize)
		writer.writeUint(entry.moofOffset, timeSize)
		writer.writeUint(entry.trafNumber, box.lengthSizeOfTrafNum + 1)
		writer.writeUint(entry.trunNumber, box.lengthSizeOfTrunNum + 1)
		writer.writeUint(entry.sampleNumber, box.lengthSizeOfSampleNum + 1)
	}

	return writer
}
