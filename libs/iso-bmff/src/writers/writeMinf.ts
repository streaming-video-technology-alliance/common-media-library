import type { MediaInformationBox } from '../boxes/MediaInformationBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write a `MediaInformationBox` to an `IsoBoxWriteView`.
 *
 * The `writers` map does not need an entry for the `minf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `MediaInformationBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeMinf(
	box: MediaInformationBox,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
