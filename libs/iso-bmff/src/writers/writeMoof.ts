import type { MovieFragmentBox } from '../boxes/MovieFragmentBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
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
 * @param box - The `MovieFragmentBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMoof(
	box: MovieFragmentBox<IsoInt64>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
