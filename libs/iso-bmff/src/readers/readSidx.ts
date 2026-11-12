import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import type { SegmentIndexReference } from '../boxes/SegmentIndexReference.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `SegmentIndexBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SegmentIndexBox`
 *
 * @public
 */
export function readSidx<V extends IsoInt64>(view: IsoBoxReadView<V>): SegmentIndexBox<V> {
	const { readUint, readWideUint } = view
	const { version, flags } = view.readFullBox()
	const v1 = version === 1
	const size = v1 ? 8 : 4

	const referenceId = readUint(4)
	const timescale = readUint(4)
	const earliestPresentationTime = readWideUint(size)
	const firstOffset = readWideUint(size)
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
		reserved,
		references,
	}
}
