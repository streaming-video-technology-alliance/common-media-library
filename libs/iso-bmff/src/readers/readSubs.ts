import type { Fields } from '../boxes/Fields.ts'
import type { SubsampleInformationBox } from '../boxes/SubsampleInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SubSampleInformationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SubSampleInformationBox
 *
 * @public
 */
export function readSubs(view: IsoBoxReadView): Fields<SubsampleInformationBox> {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)
	const entries = view.readEntries(entryCount, () => {
		const sampleDelta = view.readUint(4)
		const subsampleCount = view.readUint(2)
		const subsamples = view.readEntries(subsampleCount, () => ({
			subsampleSize: view.readUint((version === 1) ? 4 : 2),
			subsamplePriority: view.readUint(1),
			discardable: view.readUint(1),
			codecSpecificParameters: view.readUint(4),
		}))

		return {
			sampleDelta,
			subsampleCount,
			subsamples,
		}
	})

	return {
		version,
		flags,
		entryCount,
		entries,
	}
};
