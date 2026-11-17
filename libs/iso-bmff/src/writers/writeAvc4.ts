import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write the `avc4` box (`VisualSampleEntryBox`).
 *
 * @param box - The `VisualSampleEntryBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeAvc4(
	box: VisualSampleEntryBox<'avc4'>,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, config)
}
