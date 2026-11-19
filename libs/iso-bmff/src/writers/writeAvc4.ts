import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `avc4` box (`VisualSampleEntry`).
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeAvc4(
	cursor: IsoBoxWriteCursor,
	box: VisualSampleEntry<'avc4', IsoInt64>,
): void {
	writeVisualSampleEntry(cursor, box)
}
