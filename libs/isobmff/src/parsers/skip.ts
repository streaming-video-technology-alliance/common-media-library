import type { IsoView } from '../IsoView.js';
import type { Fields } from '../boxes/Fields.js';
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.js';
import { free } from './free.js';

/**
 * Parse a FreeSpaceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FreeSpaceBox
 *
 *
 * @beta
 */
export function skip(view: IsoView): Fields<FreeSpaceBox<'skip'>> {
	return free(view);
};
