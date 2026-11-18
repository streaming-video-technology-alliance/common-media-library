import type { MediaInformationBox } from '../boxes/MediaInformationBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `minf` box (`MediaInformationBox`).
 *
 * The `writers` map does not need an entry for the `minf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `MediaInformationBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMinf(box: MediaInformationBox, config: IsoBoxWriteConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
