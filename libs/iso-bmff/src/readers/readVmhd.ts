import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `vmhd` box (`VideoMediaHeaderBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VideoMediaHeaderBox`
 *
 * @public
 */
export function readVmhd(view: IsoBoxReadView<IsoInt64>): VideoMediaHeaderBox {
	return {
		type: 'vmhd',
		...view.readFullBox(),
		graphicsMode: view.readUint(2),
		opColor: view.readArray(UINT, 2, 3),
	}
}
