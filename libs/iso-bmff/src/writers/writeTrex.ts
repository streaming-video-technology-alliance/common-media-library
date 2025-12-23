import type { Fields } from '../boxes/Fields.ts'
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackExtendsBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 *
 * @param box - The TrackExtendsBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTrex(box: Fields<TrackExtendsBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const defaultSampleDescriptionIndexSize = 4
	const defaultSampleDurationSize = 4
	const defaultSampleSizeSize = 4
	const defaultSampleFlagsSize = 4
	const totalSize = headerSize + fullBoxSize + trackIdSize + defaultSampleDescriptionIndexSize +
		defaultSampleDurationSize + defaultSampleSizeSize + defaultSampleFlagsSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'trex', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.trackId)
	offset += 4

	writeUint(dataView, offset, 4, box.defaultSampleDescriptionIndex)
	offset += 4

	writeUint(dataView, offset, 4, box.defaultSampleDuration)
	offset += 4

	writeUint(dataView, offset, 4, box.defaultSampleSize)
	offset += 4

	writeUint(dataView, offset, 4, box.defaultSampleFlags)

	return new Uint8Array(buffer)
}

