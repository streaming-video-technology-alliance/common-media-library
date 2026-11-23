import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxType } from '../IsoBoxType.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Create a reader for a visual sample entry box of a type with no default reader, such as `av01` or `vp09`.
 *
 * The readers map takes the reader under a key of `IsoBoxMap`. Add another type to `IsoCustomBoxMap` first.
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
): <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => VisualSampleEntry<T, V> {
	return <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => readVisualSampleEntry(type, cursor)
}
