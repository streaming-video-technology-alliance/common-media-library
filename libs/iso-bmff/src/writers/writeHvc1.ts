import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (hvc1) to a Uint8Array.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeHvc1(box: Fields<VisualSampleEntryBox<'hvc1'>>): Uint8Array {
	return writeAvc1(box, 'hvc1')
}

