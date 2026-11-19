import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stss` box (`SyncSampleBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SyncSampleBox`
 *
 * @public
 */
export function readStss(cursor: IsoBoxReadCursor<IsoInt64>): SyncSampleBox {
	const view = new IsoBoxReadView(cursor)

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
