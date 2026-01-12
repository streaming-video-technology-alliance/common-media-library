import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `VideoMediaHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VideoMediaHeaderBox`
 *
 * @public
 */
export function readVmhd(view: IsoBoxReadView): VideoMediaHeaderBox {
	return {
		type: 'vmhd',
		...view.readFullBox(),
		graphicsmode: view.readUint(2),
		opcolor: view.readArray(UINT, 2, 3),
	}
};
