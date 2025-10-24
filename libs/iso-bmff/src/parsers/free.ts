import type { Fields } from '../boxes/Fields.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed Box
 *
 *
 * @beta
 */
export function free(view: IsoView): Fields<FreeSpaceBox> {
	return {
		data: view.readData(-1),
	}
};
