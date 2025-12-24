import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoDataWriter } from '../utils/IsoDataWriter.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (encv) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeEncv(box: VisualSampleEntryBox<'encv'>): IsoDataWriter {
	return writeAvc1(box, 'encv')
}
