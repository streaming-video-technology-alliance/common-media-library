import type { Fields } from '../boxes/types/Fields.ts'
import type { TrackFragmentHeaderBox } from '../boxes/types/TrackFragmentHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackFragmentHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 *
 * @param box - The TrackFragmentHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTfhd(box: Fields<TrackFragmentHeaderBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const baseDataOffsetSize = (box.flags & 0x01) ? 8 : 0
	const sampleDescriptionIndexSize = (box.flags & 0x02) ? 4 : 0
	const defaultSampleDurationSize = (box.flags & 0x08) ? 4 : 0
	const defaultSampleSizeSize = (box.flags & 0x10) ? 4 : 0
	const defaultSampleFlagsSize = (box.flags & 0x20) ? 4 : 0
	const totalSize = headerSize + fullBoxSize + trackIdSize + baseDataOffsetSize +
		sampleDescriptionIndexSize + defaultSampleDurationSize + defaultSampleSizeSize + defaultSampleFlagsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('tfhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.trackId, 4)

	if (box.flags & 0x01) {
		writer.writeUint(box.baseDataOffset ?? 0, 8)
	}

	if (box.flags & 0x02) {
		writer.writeUint(box.sampleDescriptionIndex ?? 0, 4)
	}

	if (box.flags & 0x08) {
		writer.writeUint(box.defaultSampleDuration ?? 0, 4)
	}

	if (box.flags & 0x10) {
		writer.writeUint(box.defaultSampleSize ?? 0, 4)
	}

	if (box.flags & 0x20) {
		writer.writeUint(box.defaultSampleFlags ?? 0, 4)
	}

	return writer
}
