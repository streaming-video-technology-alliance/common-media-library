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

