import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { writeVisualSampleEntryBox } from './writeVisualSampleEntryBox.ts'

/**
 * Write a VisualSampleEntryBox (avc4) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeAvc4(box: VisualSampleEntryBox<'avc4'>): IsoBoxWriteView {
	return writeVisualSampleEntryBox(box, 'avc4')
}
