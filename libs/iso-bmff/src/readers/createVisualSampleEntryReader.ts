import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readVisualSampleEntryBox } from './readVisualSampleEntryBox.ts'

/**
 * Creates a reader function for VisualSampleEntryBox with a custom type.
 *
 * This utility allows reading visual sample entry boxes with types that
 * aren't in the standard VisualSampleEntryType union (e.g., 'avc1', 'hvc1').
 *
 * @param type - The 4-character box type
 *
 * @returns A reader function that can be passed to readIsoBoxes
 *
 * @example
 * ```ts
 * const boxes = readIsoBoxes(data, {
 *   readers: {
 *     'vp09': createVisualSampleEntryReader('vp09'),
 *     'av01': createVisualSampleEntryReader('av01'),
 *   }
 * })
 * ```
 *
 * @public
 */
export function createVisualSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView) => VisualSampleEntryBox<T> {
	return (view: IsoBoxReadView) => readVisualSampleEntryBox<T>(type, view)
}
