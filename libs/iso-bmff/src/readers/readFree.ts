import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `FreeSpaceBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `FreeSpaceBox`
 *
 * @public
 */
export function readFree(view: IsoBoxReadView): FreeSpaceBox {
	return {
		type: 'free',
		data: view.readData(-1),
	}
};
