import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'

/**
 * Read the `sthd` box (`SubtitleMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubtitleMediaHeaderBox`
 *
 * @public
 */
export function readSthd(cursor: IsoBoxReadCursor<IsoInt64>): SubtitleMediaHeaderBox {
	return {
		type: 'sthd',
		version: readUint8(cursor),
		flags: readUint24(cursor),
	}
}
