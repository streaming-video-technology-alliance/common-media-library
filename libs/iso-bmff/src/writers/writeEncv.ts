import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write a VisualSampleEntryBox (encv) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 * @param config - The IsoBoxWriteViewConfig to use
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeEncv(box: VisualSampleEntryBox<'encv'>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, config)
}
