import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readVisualSampleEntry } from './readVisualSampleEntry.ts'

/**
 * Read the `encv` box (`VisualSampleEntry`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `VisualSampleEntry`
 *
 * @public
 */
export function readEncv(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<'encv'> {
	return readVisualSampleEntry('encv', cursor)
}
