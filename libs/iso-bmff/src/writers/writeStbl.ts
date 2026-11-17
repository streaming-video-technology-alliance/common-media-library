import type { SampleTableBox } from '../boxes/SampleTableBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write a `SampleTableBox` to an `IsoBoxWriteView`.
 *
 * The `writers` map does not need an entry for the `stbl` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `SampleTableBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeStbl(box: SampleTableBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
