import type { TrackReferenceBox } from '../boxes/TrackReferenceBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `tref` box (`TrackReferenceBox`).
 *
 * The `writers` map does not need an entry for the `tref` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `TrackReferenceBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeTref(box: TrackReferenceBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
