import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
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
export function readAvc1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<'avc1'> {
	return readVisualSampleEntryBox('avc1', view)
}
