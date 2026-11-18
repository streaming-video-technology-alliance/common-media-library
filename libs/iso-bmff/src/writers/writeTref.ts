import type { TrackReferenceBox } from '../boxes/TrackReferenceBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `tref` box (`TrackReferenceBox`).
 *
 * The `writers` map does not need an entry for the `tref` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `TrackReferenceBox` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeTref(box: TrackReferenceBox, config: IsoBoxWriteConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
