import type { Fields } from '../boxes/types/Fields.ts'
import type { SubsegmentIndexBox } from '../boxes/types/SubsegmentIndexBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SubsegmentIndexBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 *
 * @param box - The SubsegmentIndexBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSsix(box: Fields<SubsegmentIndexBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const subsegmentCountSize = 4

	let rangesSize = 0
	for (const subsegment of box.subsegments) {
		rangesSize += 4 // rangesCount
		rangesSize += subsegment.rangesCount * 4 // level (1) + rangeSize (3) per range
	}

	const totalSize = headerSize + fullBoxSize + subsegmentCountSize + rangesSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('ssix', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.subsegmentCount, 4)

	for (const subsegment of box.subsegments) {
		writer.writeUint(subsegment.rangesCount, 4)

		for (const range of subsegment.ranges) {
			writer.writeUint(range.level, 1)
			writer.writeUint(range.rangeSize, 3)
		}
	}

	return writer
}
