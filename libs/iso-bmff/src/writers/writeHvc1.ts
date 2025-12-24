import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoDataWriter } from '../utils/IsoDataWriter.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (hvc1) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeHvc1(box: VisualSampleEntryBox<'hvc1'>): IsoDataWriter {
	return writeAvc1(box, 'hvc1')
}
