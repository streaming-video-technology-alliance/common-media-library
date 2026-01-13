import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write a `VisualSampleEntryBox` (avc4) to an `IsoBoxWriteView`.
 *
 * @param box - The `VisualSampleEntryBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` to use
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeAvc4(box: VisualSampleEntryBox<'avc4'>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, config)
}
