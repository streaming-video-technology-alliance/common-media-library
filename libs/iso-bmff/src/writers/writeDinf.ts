import type { DataInformationBox } from '../boxes/DataInformationBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `dinf` box (`DataInformationBox`).
 *
 * The `writers` map does not need an entry for the `dinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param box - The `DataInformationBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeDinf(box: DataInformationBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeContainerBox(box, config)
}
