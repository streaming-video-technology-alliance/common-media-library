import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoDataWriter } from '../utils/IsoDataWriter.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (avc2) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeAvc2(box: Fields<VisualSampleEntryBox<'avc2'>>): IsoDataWriter {
	return writeAvc1(box, 'avc2')
}
