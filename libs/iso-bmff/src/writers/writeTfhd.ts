import type { Fields } from '../boxes/Fields.ts'
import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackFragmentHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 *
 * @param box - The TrackFragmentHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTfhd(box: Fields<TrackFragmentHeaderBox>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'tfhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.trackId)
	offset += 4

	if (box.flags & 0x01) {
		writeUint(dataView, offset, 8, box.baseDataOffset ?? 0)
		offset += 8
	}

	if (box.flags & 0x02) {
		writeUint(dataView, offset, 4, box.sampleDescriptionIndex ?? 0)
		offset += 4
	}

	if (box.flags & 0x08) {
		writeUint(dataView, offset, 4, box.defaultSampleDuration ?? 0)
		offset += 4
	}

	if (box.flags & 0x10) {
		writeUint(dataView, offset, 4, box.defaultSampleSize ?? 0)
		offset += 4
	}

	if (box.flags & 0x20) {
		writeUint(dataView, offset, 4, box.defaultSampleFlags ?? 0)
		offset += 4
	}

	return new Uint8Array(buffer)
}

