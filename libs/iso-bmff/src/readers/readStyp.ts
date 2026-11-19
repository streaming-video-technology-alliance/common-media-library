import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readFtyp } from './readFtyp.ts'

/**
 * Read the `styp` box (`SegmentTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SegmentTypeBox`
 *
 * @public
 */
export function readStyp(cursor: IsoBoxReadCursor<IsoInt64>): SegmentTypeBox {
	return {
		...readFtyp(cursor),
		type: 'styp',
	}
}
