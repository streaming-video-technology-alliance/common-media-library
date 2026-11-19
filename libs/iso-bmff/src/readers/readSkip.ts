import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { readFree } from './readFree.ts'

/**
 * Read the `skip` box (`FreeSpaceBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `FreeSpaceBox`
 *
 * @public
 */
export function readSkip(cursor: IsoBoxReadCursor<IsoInt64>): FreeSpaceBox<'skip'> {
	return {
		...readFree(cursor),
		type: 'skip',
	}
}
