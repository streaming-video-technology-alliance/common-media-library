import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MediaBox } from '../boxes/MediaBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `mdia` box (`MediaBox`).
 *
 * The `writers` map does not need an entry for the `mdia` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `MediaBox` fields to write
 *
 * @public
 */
export function writeMdia(cursor: IsoBoxWriteCursor, box: MediaBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
