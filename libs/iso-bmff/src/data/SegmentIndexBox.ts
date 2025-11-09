import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 */
export type SegmentIndexReference = {
	reference: number
	subsegmentDuration: number
	sap: number
	referenceType: number
	referencedSize: number
	startsWithSap: number
	sapType: number
	sapDeltaTime: number
}

export class SegmentIndexBox extends FullBox {
	referenceId: number
	timescale: number
	earliestPresentationTime: number
	firstOffset: number
	reserved: number
	references: SegmentIndexReference[]

	constructor(
		version: number,
		flags: number,
		referenceId: number,
		timescale: number,
		earliestPresentationTime: number,
		firstOffset: number,
		reserved: number,
		references: SegmentIndexReference[] = []
	) {
		super('sidx', version, flags)
		this.referenceId = referenceId
		this.timescale = timescale
		this.earliestPresentationTime = earliestPresentationTime
		this.firstOffset = firstOffset
		this.reserved = reserved
		this.references = references
	}

	override get size(): number {
		const timeSize = this.version === 1 ? 8 : 4
		const entrySize = 20 // reference fields
		// 8 (box header) + 4 (FullBox) + 4 + 4 + timeSize + 8 + 2 + (references.length * entrySize)
		return 30 + timeSize + (this.references.length * entrySize)
	}
}

