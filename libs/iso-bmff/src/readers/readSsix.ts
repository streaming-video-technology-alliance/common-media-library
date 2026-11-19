import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { SubsegmentIndexBox } from '../boxes/SubsegmentIndexBox.ts'

/**
 * Read the `ssix` box (`SubsegmentIndexBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubsegmentIndexBox`
 *
 * @public
 */
export function readSsix(cursor: IsoBoxReadCursor<IsoInt64>): SubsegmentIndexBox {
	const view = new IsoBoxReadView(cursor)

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

	return {
		type: 'ssix',
		version,
		flags,
		subsegmentCount,
		subsegments,
	}
}
