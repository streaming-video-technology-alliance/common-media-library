import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntryBox } from './readVisualSampleEntryBox.ts'

/**
 * Read the `encv` box (`VisualSampleEntryBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntryBox`
 *
 * @public
 */
export function readEncv(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<'encv'> {
	return readVisualSampleEntryBox('encv', view)
}
