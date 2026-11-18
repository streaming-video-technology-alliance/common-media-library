import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `avc1` box (`VisualSampleEntry`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readAvc1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntry<'avc1'> {
	return readVisualSampleEntry('avc1', view)
}
