import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MediaInformationBox } from '../boxes/MediaInformationBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `minf` box (`MediaInformationBox`).
 *
 * The `writers` map does not need an entry for the `minf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `MediaInformationBox` fields to write
 *
 * @public
 */
export function writeMinf(cursor: IsoBoxWriteCursor, box: MediaInformationBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
