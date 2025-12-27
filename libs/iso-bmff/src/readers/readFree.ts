import type { Fields } from '../boxes/types/Fields.ts'
import type { FreeSpaceBox } from '../boxes/types/FreeSpaceBox.ts'
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
export function readFree(view: IsoBoxReadView): Fields<FreeSpaceBox> {
	return {
		data: view.readData(-1),
	}
};
