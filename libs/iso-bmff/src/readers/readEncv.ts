import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
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
export function readEncv(view: IsoBoxReadView): VisualSampleEntryBox<'encv'> {
	return readVisualSampleEntryBox('encv', view)
}
