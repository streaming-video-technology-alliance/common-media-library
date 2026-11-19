import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `avc3` box (`VisualSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readAvc3(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<'avc3'> {
	return readVisualSampleEntry('avc3', cursor)
}
