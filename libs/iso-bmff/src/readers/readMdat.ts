import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mdat` box (`MediaDataBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MediaDataBox`
 *
 * @public
 */
export function readMdat(view: IsoBoxReadView<IsoInt64>): MediaDataBox {
	return {
		type: 'mdat',
		data: view.readData(-1),
	}
}
