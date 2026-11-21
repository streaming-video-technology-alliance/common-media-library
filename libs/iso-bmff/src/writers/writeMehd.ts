import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `mehd` box (`MovieExtendsHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieExtendsHeaderBox` fields to write
 *
 * @public
 */
export function writeMehd(cursor: IsoBoxWriteCursor, box: MovieExtendsHeaderBox<IsoInt64>): void {
	const start = beginIsoFullBox(cursor, 'mehd', box.version, box.flags)

	writeWideUint(cursor, box.fragmentDuration, box.version === 1 ? 8 : 4)
	endIsoBox(cursor, start)
}
