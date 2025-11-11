import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	static readonly type = 'sidx'

	/**
	 * Reads a SegmentIndexBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
	 */
	static read(view: IsoView): SegmentIndexBox {
		const { readUint } = view
		const { version, flags } = view.readFullBox()
		const v1 = version === 1
		const size = v1 ? 8 : 4

		const referenceId = readUint(4)
		const timescale = readUint(4)
		const earliestPresentationTime = readUint(size)
		const firstOffset = readUint(size)
		const reserved = readUint(2)
		const referenceCount = readUint(2)
		const references = view.readEntries<SegmentIndexReference>(referenceCount, () => {
			const reference = readUint(4)
			const subsegmentDuration = readUint(4)
			const sap = readUint(4)
			return {
				reference,
				subsegmentDuration,
				sap,
				referenceType: (reference >> 31) & 0x00000001,
				referencedSize: reference & 0x7FFFFFFF,
				startsWithSap: (sap >> 31) & 0x00000001,
				sapType: (sap >> 28) & 0x00000007,
				sapDeltaTime: sap & 0x0FFFFFFF,
			}
		})

		return new SegmentIndexBox(version, flags, referenceId, timescale, earliestPresentationTime, firstOffset, reserved, references)
	}

	/**
	 * Writes a SegmentIndexBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
	 */
	static write(box: SegmentIndexBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.referenceId, 4)
		view.writeUint(box.timescale, 4)
		const timeSize = box.version === 1 ? 8 : 4
		view.writeUint(box.earliestPresentationTime, timeSize)
		view.writeUint(box.firstOffset, timeSize)
		view.writeUint(box.reserved, 2)
		view.writeUint(box.references.length, 2)
		for (const ref of box.references) {
			const reference = (ref.referenceType << 31) | (ref.referencedSize & 0x7FFFFFFF)
			view.writeUint(reference, 4)
			view.writeUint(ref.subsegmentDuration, 4)
			const sap = (ref.startsWithSap << 31) | ((ref.sapType & 0x07) << 28) | (ref.sapDeltaTime & 0x0FFFFFFF)
			view.writeUint(sap, 4)
		}
	}

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
