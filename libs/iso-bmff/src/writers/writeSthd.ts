import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `sthd` box (`SubtitleMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.6.2
 *
 * @param cursor - The write cursor
 * @param box - The `SubtitleMediaHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeSthd(cursor: IsoBoxWriteCursor, box: SubtitleMediaHeaderBox): void {
	endIsoBox(cursor, beginIsoFullBox(cursor, 'sthd', box.version, box.flags))
}
