import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieFragmentBox } from '../boxes/MovieFragmentBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `moof` box (`MovieFragmentBox`).
 *
 * The `writers` map does not need an entry for the `moof` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieFragmentBox` fields to write
 *
 * @public
 */
export function writeMoof(cursor: IsoBoxWriteCursor, box: MovieFragmentBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
