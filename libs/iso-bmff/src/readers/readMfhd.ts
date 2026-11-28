import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `mfhd` box (`MovieFragmentHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieFragmentHeaderBox`
 *
 * @public
 */
export function readMfhd(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentHeaderBox {
	return {
		type: 'mfhd',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		sequenceNumber: readUint32(cursor),
	}
}
