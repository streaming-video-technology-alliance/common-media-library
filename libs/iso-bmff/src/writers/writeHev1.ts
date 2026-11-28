import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `hev1` box (`VisualSampleEntry`).
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeHev1(
	cursor: IsoBoxWriteCursor,
	box: VisualSampleEntry<'hev1', IsoInt64>,
): void {
	writeVisualSampleEntry(cursor, box)
}
