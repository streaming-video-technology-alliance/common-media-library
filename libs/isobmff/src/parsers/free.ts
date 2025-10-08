import type { Fields } from '../boxes/Fields.js';
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.js';
import type { IsoView } from '../IsoView.js';

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
	};
};
