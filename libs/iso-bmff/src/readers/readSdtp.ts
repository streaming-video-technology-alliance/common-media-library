import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sdtp` box (`SampleDependencyTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleDependencyTypeBox`
 *
 * @public
 */
export function readSdtp(cursor: IsoBoxReadCursor<IsoInt64>): SampleDependencyTypeBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'sdtp',
		...view.readFullBox(),
		sampleDependencyTable: view.readArray(UINT, 1, view.bytesRemaining),
	}
}
