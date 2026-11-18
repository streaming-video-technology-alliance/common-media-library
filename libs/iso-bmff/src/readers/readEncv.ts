import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `encv` box (`VisualSampleEntry`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readEncv(view: IsoBoxReadView<IsoInt64>): VisualSampleEntry<'encv'> {
	return readVisualSampleEntry('encv', view)
}
