import type { MovieExtendsBox } from '../boxes/MovieExtendsBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write a `MovieExtendsBox` to an `IsoBoxWriteView`.
 *
 * The `writers` map does not need an entry for the `mvex` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param box - The `MovieExtendsBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeMvex(
	box: MovieExtendsBox<IsoInt64>,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
