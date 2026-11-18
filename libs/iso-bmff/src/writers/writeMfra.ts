import type { MovieFragmentRandomAccessBox } from '../boxes/MovieFragmentRandomAccessBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
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
 * @param box - The `MovieFragmentRandomAccessBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMfra(
	box: MovieFragmentRandomAccessBox<IsoInt64>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
