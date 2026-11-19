import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VideoMediaHeaderBox`
 *
 * @public
 */
export function readVmhd(cursor: IsoBoxReadCursor<IsoInt64>): VideoMediaHeaderBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'vmhd',
		...view.readFullBox(),
		graphicsMode: view.readUint(2),
		opColor: view.readArray(UINT, 2, 3),
	}
}
