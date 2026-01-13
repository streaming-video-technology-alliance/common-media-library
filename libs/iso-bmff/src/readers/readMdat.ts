import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MediaDataBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MediaDataBox`
 *
 * @public
 */
export function readMdat(view: IsoBoxReadView): MediaDataBox {
	return {
		type: 'mdat',
		data: view.readData(-1),
	}
};
