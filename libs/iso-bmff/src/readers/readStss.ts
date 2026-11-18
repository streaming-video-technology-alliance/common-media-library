import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stss` box (`SyncSampleBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SyncSampleBox`
 *
 * @public
 */
export function readStss(view: IsoBoxReadView<IsoInt64>): SyncSampleBox {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stss',
		version,
		flags,
		entryCount,
		sampleNumber: view.readArray(UINT, 4, entryCount),
	}
}
