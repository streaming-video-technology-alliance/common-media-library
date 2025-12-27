import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { readFree } from './readFree.ts'

/**
 * Parse a FreeSpaceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FreeSpaceBox
 *
 * @public
 */
export function readSkip(view: IsoBoxReadView): Fields<FreeSpaceBox<'skip'>> {
	return readFree(view)
};
