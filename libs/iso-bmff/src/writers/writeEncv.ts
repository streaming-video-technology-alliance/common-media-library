import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `encv` box (`VisualSampleEntry`).
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeEncv(
	cursor: IsoBoxWriteCursor,
	box: VisualSampleEntry<'encv', IsoInt64>,
): void {
	writeVisualSampleEntry(cursor, box)
}
