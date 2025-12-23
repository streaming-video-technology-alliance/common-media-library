import type { Fields } from '../boxes/Fields.ts'
import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackRunBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 *
 * @param box - The TrackRunBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTrun(box: Fields<TrackRunBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleCountSize = 4
	const dataOffsetSize = (box.flags & 0x1) ? 4 : 0
	const firstSampleFlagsSize = (box.flags & 0x4) ? 4 : 0

	let sampleSize = 0
	if (box.flags & 0x100) sampleSize += 4 // sampleDuration
	if (box.flags & 0x200) sampleSize += 4 // sampleSize
	if (box.flags & 0x400) sampleSize += 4 // sampleFlags
	if (box.flags & 0x800) sampleSize += 4 // sampleCompositionTimeOffset

	const samplesSize = sampleSize * box.sampleCount
	const totalSize = headerSize + fullBoxSize + sampleCountSize + dataOffsetSize + firstSampleFlagsSize + samplesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'trun', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.sampleCount)
	offset += 4

	if (box.flags & 0x1) {
		writeUint(dataView, offset, 4, box.dataOffset ?? 0)
		offset += 4
	}

	if (box.flags & 0x4) {
		writeUint(dataView, offset, 4, box.firstSampleFlags ?? 0)
		offset += 4
	}

	for (const sample of box.samples) {
		if (box.flags & 0x100) {
			writeUint(dataView, offset, 4, sample.sampleDuration ?? 0)
			offset += 4
		}
		if (box.flags & 0x200) {
			writeUint(dataView, offset, 4, sample.sampleSize ?? 0)
			offset += 4
		}
		if (box.flags & 0x400) {
			writeUint(dataView, offset, 4, sample.sampleFlags ?? 0)
			offset += 4
		}
		if (box.flags & 0x800) {
			writeUint(dataView, offset, 4, sample.sampleCompositionTimeOffset ?? 0)
			offset += 4
		}
	}

	return new Uint8Array(buffer)
}

