import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoDataWriter } from '../utils/IsoDataWriter.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (avc4) to an IsoDataWriter.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeAvc4(box: Fields<VisualSampleEntryBox<'avc4'>>): IsoDataWriter {
	return writeAvc1(box, 'avc4')
}
