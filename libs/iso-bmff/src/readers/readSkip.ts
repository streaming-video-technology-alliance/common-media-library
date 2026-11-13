import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { readFree } from './readFree.ts'

/**
 * Parse a `FreeSpaceBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `FreeSpaceBox`
 *
 * @public
 */
export function readSkip(view: IsoBoxReadView<IsoInt64>): FreeSpaceBox<'skip'> {
	return {
		...readFree(view),
		type: 'skip',
	}
}
