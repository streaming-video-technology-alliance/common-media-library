import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `avc2` box (`VisualSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readAvc2<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): VisualSampleEntry<'avc2', V> {
	return readVisualSampleEntry('avc2', cursor)
}
