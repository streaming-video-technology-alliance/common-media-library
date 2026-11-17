import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `free` box (`FreeSpaceBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `FreeSpaceBox`
 *
 * @public
 */
export function readFree(view: IsoBoxReadView<IsoInt64>): FreeSpaceBox {
	return {
		type: 'free',
		data: view.readData(-1),
	}
}
