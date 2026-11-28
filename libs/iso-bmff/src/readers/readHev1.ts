import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `hev1` box (`VisualSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readHev1<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): VisualSampleEntry<'hev1', V> {
	return readVisualSampleEntry('hev1', cursor)
}
