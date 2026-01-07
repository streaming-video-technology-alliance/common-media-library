import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write a VisualSampleEntryBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.1.3 Visual Sample Entry
 *
 * @param box - The VisualSampleEntryBox fields to write
 * @param config - The IsoBoxWriteViewConfig to use
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeAvc1(box: VisualSampleEntryBox<'avc1'>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, config)
}
