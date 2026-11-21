import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieExtendsBox } from '../boxes/MovieExtendsBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `mvex` box (`MovieExtendsBox`).
 *
 * The `writers` map does not need an entry for the `mvex` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieExtendsBox` fields to write
 *
 * @public
 */
export function writeMvex(cursor: IsoBoxWriteCursor, box: MovieExtendsBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
