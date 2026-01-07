import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readVisualSampleEntryBox } from './readVisualSampleEntryBox.ts'

/**
 * Parse a VisualSampleEntryBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VisualSampleEntryBox
 *
 * @public
 */
export function readAvc1(view: IsoBoxReadView): VisualSampleEntryBox<'avc1'> {
	return readVisualSampleEntryBox('avc1', view)
}
