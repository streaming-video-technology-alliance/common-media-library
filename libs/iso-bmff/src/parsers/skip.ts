import type { IsoView } from '../IsoView.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts';
import { free } from './free.ts';

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
