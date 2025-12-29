import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed Box
 *
 * @public
 */
export function readFree(view: IsoBoxReadView): FreeSpaceBox {
	return {
		type: 'free',
		data: view.readData(-1),
	}
};
