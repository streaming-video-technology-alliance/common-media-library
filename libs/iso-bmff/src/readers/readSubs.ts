import type { SubSampleInformationBox } from '../boxes/SubSampleInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `subs` box (`SubSampleInformationBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubSampleInformationBox`
 *
 * @public
 */
export function readSubs(cursor: IsoBoxReadCursor<IsoInt64>): SubSampleInformationBox {
	const view = new IsoBoxReadView(cursor)

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
