import type { Fields } from '../boxes/Fields.ts'
import type { SubsegmentIndexBox } from '../boxes/SubsegmentIndexBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SubsegmentIndexBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 *
 * @param box - The SubsegmentIndexBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSsix(box: Fields<SubsegmentIndexBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const subsegmentCountSize = 4

	let rangesSize = 0
	for (const subsegment of box.subsegments) {
		rangesSize += 4 // rangesCount
		rangesSize += subsegment.rangesCount * 4 // level (1) + rangeSize (3) per range
	}

	const totalSize = headerSize + fullBoxSize + subsegmentCountSize + rangesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'ssix', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.subsegmentCount)
	offset += 4

	for (const subsegment of box.subsegments) {
		writeUint(dataView, offset, 4, subsegment.rangesCount)
		offset += 4

		for (const range of subsegment.ranges) {
			writeUint(dataView, offset, 1, range.level)
			offset += 1
			writeUint(dataView, offset, 3, range.rangeSize)
			offset += 3
		}
	}

	return new Uint8Array(buffer)
}

