import type { Subsegment } from '../boxes/Subsegment.ts'
import type { SubsegmentIndexBox } from '../boxes/SubsegmentIndexBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 */

export class ssix extends FullBoxBase<SubsegmentIndexBox> {
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
		return new ssix(subsegmentCount, subsegments, version, flags)
	}

	/**
	 * Writes a SubsegmentIndexBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
	 */
	static write(box: SubsegmentIndexBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.subsegmentCount, 4)
		for (const subsegment of box.subsegments) {
			view.writeUint(subsegment.rangesCount, 4)
			for (const range of subsegment.ranges) {
				view.writeUint(range.level, 1)
				view.writeUint(range.rangeSize, 3)
			}
		}
	}

	subsegmentCount: number
	subsegments: Subsegment[]

	constructor(subsegmentCount: number, subsegments: Subsegment[] = [], version?: number, flags?: number) {
		super('ssix', version, flags)
		this.subsegmentCount = subsegmentCount
		this.subsegments = subsegments
	}

	override get size(): number {
		// 4 (subsegmentCount) + sum of subsegment sizes
		let size = 4

		for (const subsegment of this.subsegments) {
			size += 4 // rangesCount
			size += subsegment.ranges.length * 5 // each range: 1 byte level + 4 bytes rangeSize
		}

		return size
	}
}
