import type { Fields } from '../boxes/types/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/types/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write a VisualSampleEntryBox (hev1) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeHev1(box: Fields<VisualSampleEntryBox<'hev1'>>): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, 'hev1')
}
