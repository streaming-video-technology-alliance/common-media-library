import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { Fields } from '../boxes/types/Fields.ts'
import type { SubsegmentIndexBox } from '../boxes/types/SubsegmentIndexBox.ts'

/**
 * Parse a SubsegmentIndexBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubsegmentIndexBox
 *
 * @public
 */
export function readSsix(view: IsoBoxReadView): Fields<SubsegmentIndexBox> {
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
		version,
		flags,
		subsegmentCount,
		subsegments,
	}
};
