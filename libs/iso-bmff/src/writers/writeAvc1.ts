import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `avc1` box (`VisualSampleEntry`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.3
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeAvc1(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<'avc1'>): void {
	writeVisualSampleEntry(cursor, box)
}
