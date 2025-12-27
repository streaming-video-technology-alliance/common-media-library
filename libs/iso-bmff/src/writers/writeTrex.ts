import type { Fields } from '../boxes/types/Fields.ts'
import type { TrackExtendsBox } from '../boxes/types/TrackExtendsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackExtendsBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 *
 * @param box - The TrackExtendsBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTrex(box: Fields<TrackExtendsBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const defaultSampleDescriptionIndexSize = 4
	const defaultSampleDurationSize = 4
	const defaultSampleSizeSize = 4
	const defaultSampleFlagsSize = 4
	const totalSize = headerSize + fullBoxSize + trackIdSize + defaultSampleDescriptionIndexSize +
		defaultSampleDurationSize + defaultSampleSizeSize + defaultSampleFlagsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('trex', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.trackId, 4)
	writer.writeUint(box.defaultSampleDescriptionIndex, 4)
	writer.writeUint(box.defaultSampleDuration, 4)
	writer.writeUint(box.defaultSampleSize, 4)
	writer.writeUint(box.defaultSampleFlags, 4)

	return writer
}
