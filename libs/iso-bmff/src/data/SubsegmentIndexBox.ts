import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 */
export type SubsegmentRange = {
	level: number
	rangeSize: number
}

export type Subsegment = {
	rangesCount: number
	ranges: SubsegmentRange[]
}

export class SubsegmentIndexBox extends FullBox {
	static readonly type = 'ssix'

	/**
	 * Reads a SubsegmentIndexBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
	 */
	static read(view: IsoView): SubsegmentIndexBox {
		const { version, flags } = view.readFullBox()
		const subsegmentCount = view.readUint(4)
		const subsegments = view.readEntries(subsegmentCount, () => {
			const rangesCount = view.readUint(4)
			const ranges = view.readEntries(rangesCount, () => ({
				level: view.readUint(1),
				rangeSize: view.readUint(3),
			}))
			return { rangesCount, ranges }
		})
		return new SubsegmentIndexBox(version, flags, subsegmentCount, subsegments)
	}

	/**
	 * Writes a SubsegmentIndexBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
	 */
	static write(box: SubsegmentIndexBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write subsegmentCount (4 bytes)
		writeUint(dataView, cursor, 4, box.subsegmentCount)
		cursor += 4

		// Write subsegments
		for (const subsegment of box.subsegments) {
			writeUint(dataView, cursor, 4, subsegment.rangesCount)
			cursor += 4

			for (const range of subsegment.ranges) {
				writeUint(dataView, cursor, 1, range.level)
				cursor += 1
				writeUint(dataView, cursor, 3, range.rangeSize)
				cursor += 3
			}
		}

		return cursor - bufferOffset
	}

	subsegmentCount: number
	subsegments: Subsegment[]

	constructor(version: number, flags: number, subsegmentCount: number, subsegments: Subsegment[] = []) {
		super('ssix', version, flags)
		this.subsegmentCount = subsegmentCount
		this.subsegments = subsegments
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (subsegmentCount) + sum of subsegment sizes
		let size = 16

		for (const subsegment of this.subsegments) {
			size += 4 // rangesCount
			size += subsegment.ranges.length * 5 // each range: 1 byte level + 4 bytes rangeSize
		}

		return size
	}
}
