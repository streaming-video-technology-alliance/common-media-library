import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `mfro` box (`MovieFragmentRandomAccessOffsetBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieFragmentRandomAccessOffsetBox`
 *
 * @public
 */
export function readMfro(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentRandomAccessOffsetBox {
	return {
		type: 'mfro',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		mfraSize: readUint32(cursor),
	}
}
