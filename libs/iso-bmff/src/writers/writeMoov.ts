import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieBox } from '../boxes/MovieBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `moov` box (`MovieBox`).
 *
 * The `writers` map does not need an entry for the `moov` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieBox` fields to write
 *
 * @public
 */
export function writeMoov(cursor: IsoBoxWriteCursor, box: MovieBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
