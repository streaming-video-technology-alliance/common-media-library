import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import { readVisualSampleEntryBox } from './readVisualSampleEntryBox.ts'

/**
 * Parse a `VisualSampleEntryBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntryBox`
 *
 * @public
 */
export function readAvc3(view: IsoBoxReadView): VisualSampleEntryBox<'avc3'> {
	return readVisualSampleEntryBox('avc3', view)
}
