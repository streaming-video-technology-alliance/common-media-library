import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieFragmentRandomAccessBox } from '../boxes/MovieFragmentRandomAccessBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `mfra` box (`MovieFragmentRandomAccessBox`).
 *
 * The `writers` map does not need an entry for the `mfra` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * The writer does not change the `mfraSize` field of the `mfro` child. Set `mfraSize` after a change to the children.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieFragmentRandomAccessBox` fields to write
 *
 * @public
 */
export function writeMfra(
	cursor: IsoBoxWriteCursor,
	box: MovieFragmentRandomAccessBox<IsoInt64>,
): void {
	writeContainerBox(cursor, box)
}
