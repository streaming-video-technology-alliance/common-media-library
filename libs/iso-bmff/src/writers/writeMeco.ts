import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { AdditionalMetadataContainerBox } from '../boxes/AdditionalMetadataContainerBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `meco` box (`AdditionalMetadataContainerBox`).
 *
 * The `writers` map does not need an entry for the `meco` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `AdditionalMetadataContainerBox` fields to write
 *
 * @public
 */
export function writeMeco(
	cursor: IsoBoxWriteCursor,
	box: AdditionalMetadataContainerBox<IsoInt64>,
): void {
	writeContainerBox(cursor, box)
}
