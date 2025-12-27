import type { CompositionTimeToSampleBox } from '../boxes/types/CompositionTimeToSampleBox.ts'
import type { CompositionTimeToSampleEntry } from '../boxes/types/CompositionTimeToSampleEntry.ts'
import type { Fields } from '../boxes/types/Fields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a CompositionTimeToSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed CompositionTimeToSampleBox
 *
 * @public
 */
export function readCtts(view: IsoBoxReadView): Fields<CompositionTimeToSampleBox> {
	const { version, flags } = view.readFullBox()
	const read = version === 1 ? view.readInt : view.readUint

	const entryCount = view.readUint(4)
	const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
		sampleCount: view.readUint(4),
		sampleOffset: read(4),
	}))

	return {
		version,
		flags,
		entryCount,
		entries,
	}
};
