import type { EditBox } from '../boxes/EditBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `edts` box (`EditBox`).
 *
 * The `writers` map does not need an entry for the `edts` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param box - The `EditBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeEdts(box: EditBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
