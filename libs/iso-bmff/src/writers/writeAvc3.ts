import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write the `avc3` box (`VisualSampleEntryBox`).
 *
 * @param box - The `VisualSampleEntryBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeAvc3(
	box: VisualSampleEntryBox<'avc3'>,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, config)
}
