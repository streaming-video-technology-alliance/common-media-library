import type { SubSampleInformationBox } from '../boxes/SubSampleInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `subs` box (`SubSampleInformationBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SubSampleInformationBox`
 *
 * @public
 */
export function readSubs(view: IsoBoxReadView<IsoInt64>): SubSampleInformationBox {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)
	const entries = view.readEntries(entryCount, () => {
		const sampleDelta = view.readUint(4)
		const subsampleCount = view.readUint(2)
		const subsamples = view.readEntries(subsampleCount, () => ({
			subsampleSize: view.readUint(version === 1 ? 4 : 2),
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
		type: 'subs',
		version,
		flags,
		entryCount,
		entries,
	}
}
