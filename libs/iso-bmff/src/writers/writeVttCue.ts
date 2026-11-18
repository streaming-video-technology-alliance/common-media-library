import type { WebVttCueBox } from '../boxes/WebVttCueBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `vttc` box (`WebVttCueBox`).
 *
 * The `writers` map does not need an entry for the `vttc` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `WebVttCueBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeVttc(box: WebVttCueBox, config: IsoBoxWriteConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
