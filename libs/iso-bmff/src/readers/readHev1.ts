import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `hev1` box (`VisualSampleEntry`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readHev1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntry<'hev1'> {
	return readVisualSampleEntry('hev1', view)
}
