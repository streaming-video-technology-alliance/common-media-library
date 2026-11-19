import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import type { SegmentIndexReference } from '../boxes/SegmentIndexReference.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sidx` box (`SegmentIndexBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SegmentIndexBox`
 *
 * @public
 */
export function readSidx<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SegmentIndexBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { readUint, readWideUint } = view
	const { version, flags } = view.readFullBox()
	const size = version === 0 ? 4 : 8

	const referenceId = readUint(4)
	const timescale = readUint(4)
	const earliestPresentationTime = readWideUint(size)
	const firstOffset = readWideUint(size)
	view.jump(2)
	const referenceCount = readUint(2)
	const references = view.readEntries<SegmentIndexReference>(referenceCount, () => {
		const reference = readUint(4)
		const subsegmentDuration = readUint(4)
		const sap = readUint(4)

		return {
			subsegmentDuration,
			referenceType: (reference >> 31) & 0x00000001,
			referencedSize: reference & 0x7fffffff,
			startsWithSap: (sap >> 31) & 0x00000001,
			sapType: (sap >> 28) & 0x00000007,
			sapDeltaTime: sap & 0x0fffffff,
		}
	})

	return {
		type: 'sidx',
		version,
		flags,
		referenceId,
		timescale,
		earliestPresentationTime,
		firstOffset,
		references,
	}
}
