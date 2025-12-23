import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { writeAvc1 } from './writeAvc1.ts'

/**
 * Write a VisualSampleEntryBox (avc4) to a Uint8Array.
 *
 * @param box - The VisualSampleEntryBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeAvc4(box: Fields<VisualSampleEntryBox<'avc4'>>): Uint8Array {
	return writeAvc1(box, 'avc4')
}

