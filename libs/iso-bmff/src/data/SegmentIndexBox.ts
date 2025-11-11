import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
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
	 * Writes a SegmentIndexBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
	 */
	static write(box: SegmentIndexBox, dataView: DataView, offset: number = 0): number {
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

		// Write referenceId (4 bytes)
		writeUint(dataView, cursor, 4, box.referenceId)
		cursor += 4

		// Write timescale (4 bytes)
		writeUint(dataView, cursor, 4, box.timescale)
		cursor += 4

		// Write earliestPresentationTime
		const timeSize = box.version === 1 ? 8 : 4
		writeUint(dataView, cursor, timeSize, box.earliestPresentationTime)
		cursor += timeSize

		// Write firstOffset
		writeUint(dataView, cursor, timeSize, box.firstOffset)
		cursor += timeSize

		// Write reserved (2 bytes)
		writeUint(dataView, cursor, 2, box.reserved)
		cursor += 2

		// Write referenceCount (2 bytes)
		writeUint(dataView, cursor, 2, box.references.length)
		cursor += 2

		// Write references
		for (const ref of box.references) {
			// Pack referenceType and referencedSize into reference field
			const reference = (ref.referenceType << 31) | (ref.referencedSize & 0x7FFFFFFF)
			writeUint(dataView, cursor, 4, reference)
			cursor += 4

			writeUint(dataView, cursor, 4, ref.subsegmentDuration)
			cursor += 4

			// Pack startsWithSap, sapType, and sapDeltaTime into sap field
			const sap = (ref.startsWithSap << 31) | ((ref.sapType & 0x07) << 28) | (ref.sapDeltaTime & 0x0FFFFFFF)
			writeUint(dataView, cursor, 4, sap)
			cursor += 4
		}

		return cursor - bufferOffset
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
