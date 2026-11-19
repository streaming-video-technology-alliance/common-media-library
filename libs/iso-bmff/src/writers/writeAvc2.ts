import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `avc2` box (`VisualSampleEntry`).
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeAvc2(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<'avc2'>): void {
	writeVisualSampleEntry(cursor, box)
}
