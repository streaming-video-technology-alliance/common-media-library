import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Create a reader for a visual sample entry box of a type that `VisualSampleEntryType` does not list, such as `av01` or `vp09`.
 *
 * @param type - The 4-character box type
 *
 * @returns A reader function that can be passed to `readIsoBoxes`
 *
 * @example
 * {@includeCode ../../test/readers/createVisualSampleEntryReader.test.ts#example}
 *
 * @public
 */
export function createVisualSampleEntryReader<T extends IsoBoxType>(
	type: T,
): (view: IsoBoxReadView<IsoInt64>) => VisualSampleEntry<T> {
	return (view: IsoBoxReadView<IsoInt64>) => readVisualSampleEntry<T>(type, view)
}
